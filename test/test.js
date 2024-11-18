const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
    let Escrow, escrow;
    let owner, member1, member2, member3, unauthorized;

    beforeEach(async function () {
        [owner, member1, member2, member3, unauthorized] = await ethers.getSigners();

        // Deploy the contract
        Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(owner.address);
    });

    it("Should deploy the contract with the correct owner", async function () {
        expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should whitelist members", async function () {
        await escrow.connect(owner).setWhitelist(member1.address);
        const status = await escrow.status(member1.address);
        expect(status).to.equal(1);
    });

    it("Should not allow non-owner to whitelist members", async function () {
        await expect(
            escrow.connect(unauthorized).setWhitelist(member1.address)
        ).to.be.revertedWith("NOT AUTHORIZED");
    });

    it("Should blacklist a whitelisted member", async function () {
        await escrow.connect(owner).setWhitelist(member1.address);
        await escrow.connect(owner).blacklistMember(member1.address);
        const status = await escrow.status(member1.address);
        expect(status).to.equal(0);
    });

    it("Should allow owner to deposit funds equally among whitelisted members", async function () {
        await escrow.connect(owner).setWhitelist(member1.address);
        await escrow.connect(owner).setWhitelist(member2.address);

        await escrow.connect(owner).depositEqually({ value: ethers.parseEther("2") });

        const balance1 = await escrow.balanceOf(member1.address);
        const balance2 = await escrow.balanceOf(member2.address);

        expect(balance1).to.equal(ethers.parseEther("1"));
        expect(balance2).to.equal(ethers.parseEther("1"));
    });

    it("Should allow custom deposit to a specific member", async function () {
        await escrow.connect(owner).setWhitelist(member1.address);
        await escrow.connect(owner).depositToMembers(member1.address, { value: ethers.parseEther("1") });

        const balance = await escrow.balanceOf(member1.address);
        expect(balance).to.equal(ethers.parseEther("1"));
    });

    it("Should allow whitelisted member to withdraw funds", async function () {
        await escrow.connect(owner).setWhitelist(member1.address);

        await escrow.connect(owner).depositToMembers(member1.address, { value: ethers.parseEther("1") });

        await escrow.connect(member1).withdrawFunds(ethers.parseEther("0.5"));

        const balance = await escrow.balanceOf(member1.address);
        expect(balance).to.equal(ethers.parseEther("0.5"));
    });

    it("Should not allow non-whitelisted member to withdraw funds", async function () {
        await expect(
            escrow.connect(unauthorized).withdrawFunds(ethers.parseEther("1"))
        ).to.be.revertedWith("whitelisted");
    });

    it("Should correctly report member status", async function () {
        await escrow.connect(owner).setWhitelist(member1.address);
        const status = await escrow.status(member1.address);
        expect(status).to.equal(1);
    });
});
