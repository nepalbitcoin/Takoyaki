const address = "0x6C7c09740209c9c3EdcF65971D4616FFf0054621";

const ABI = [
    "function test(bytes32 txPreimage, bytes32 rx) public view returns (address)",
    "function isValidLabel(string label) public view returns (bool)",
    "function reveal(string label, bytes32 randomValue, address owner) public",
    "function fee() public view returns (uint256)",
    "function commit(bytes32 txPreimage) public payable returns (address)",
//    "event Commit(address indexed funder, bytes32 indexed txPreimage, bytes32 rx)",
//    "event Registered(string label, address indexed owner)"
]

const registrar = new Contract(address, ABI, accounts[0]);

(async function(label) {
    let gasPrice = await provider.getGasPrice();

    let owner = await accounts[0].getAddress();

    let randomValue = hexlify(utils.randomBytes(32));

    let revealTx = await registrar.populateTransaction.reveal(label, randomValue, owner);
    revealTx.nonce = 0;
    revealTx.chainId = provider.getNetwork().then(n => n.chainId);
    revealTx.gasPrice = gasPrice.mul(11).div(10);
    revealTx.gasLimit = 250000;

    revealTx = await utils.resolveProperties(revealTx);
    console.log("Reveal Later:", revealTx);

    let revealPreimage = keccak256(utils.serializeTransaction(revealTx));

    let commitTx = await registrar.commit(revealPreimage, {
        gasPrice: gasPrice,
        gasLimit: 500000,
        value: parseEther("0.1")
    });

    let receipt = await commitTx.wait();
    console.dir(receipt, { depth: null });
    let serializedReveal = utils.serializeTransaction(revealTx, {
        r: receipt.logs[0].data,
        s: "0x0c70dead0c70dead0c70dead0c70dead0c70dead0c70dead0c70dead0c70dead",
        recoveryParam: 0
    });
    console.log(utils.parseTransaction(serializedReveal));
    console.log(serializedReveal);

    let tx = provider.sendTransaction(serializedReveal);
    console.log(tx);
    receipt = await provider.waitForTransaction(tx.hash);
    console.log(receipt);
})("green1");
