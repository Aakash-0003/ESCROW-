
async function main() {
    const [deployer] = await ethers.getSigners();

    // Get the contract factory
    const Escrow = await ethers.getContractFactory("Escrow");

    const escrow = await Escrow.deploy(deployer);


    console.log("Escrow contract deployed to:", escrow.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
