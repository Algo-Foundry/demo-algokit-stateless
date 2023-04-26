const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

// Accounts used
const master = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);
const receiver = algosdk.mnemonicToSecretKey(process.env.ACC2_MNEMONIC);

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

const fundAccount = async (receiver, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: master.addr,
    to: receiver.addr,
    amount,
    suggestedParams,
  });

  // sign the transaction
  const signedTxn = txn.signTxn(master.sk);

  return await submitToNetwork(signedTxn);
};

(async () => {
  // Compile to TEAL
  const filePath = path.join(__dirname, "../artifacts/stateless_sc.teal");
  const data = fs.readFileSync(filePath);
  const compiledProgram = await algodClient.compile(data).do();

  // Fund the stateless smart contract with 10 Algos so it becomes a contract account
  const programBytes = new Uint8Array(
    Buffer.from(compiledProgram.result, "base64")
  );
  const lsig = new algosdk.LogicSigAccount(programBytes);
  await fundAccount({ addr: lsig.address() }, 1e7);
  console.log("Contract account address:", lsig.address());

  // get suggested parameters
  let suggestedParams = await algodClient.getTransactionParams().do();

  // send Algos using contract account
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: lsig.address(),
    to: receiver.addr,
    amount: 1e6, // send 1 Algo
    suggestedParams,
  });

  // sign with logic signature
  const lstx = algosdk.signLogicSigTransactionObject(txn, lsig);

  await submitToNetwork(lstx.blob);

  // check contract account balance
  contractAccountObj = await algodClient
    .accountInformation(lsig.address())
    .do();
  console.log("Contract account balance:", contractAccountObj.amount);
})();
