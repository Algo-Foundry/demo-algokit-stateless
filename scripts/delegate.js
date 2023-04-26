const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

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

(async () => {
  // Compile to TEAL
  const filePath = path.join(__dirname, "../artifacts/stateless_sc.teal");
  const data = fs.readFileSync(filePath);
  const compiledProgram = await algodClient.compile(data).do();

  // Create logic signature for sender account
  const programBytes = new Uint8Array(
    Buffer.from(compiledProgram.result, "base64")
  );
  const lsig = new algosdk.LogicSigAccount(programBytes);
  const sender = algosdk.mnemonicToSecretKey(process.env.ACC1_MNEMONIC);
  lsig.sign(sender.sk);

  // sender balance before
  const senderBalanceBefore = await algodClient
    .accountInformation(sender.addr)
    .do();

  // get suggested parameters
  let suggestedParams = await algodClient.getTransactionParams().do();

  // use the logic signature of the delegated acc1 to sign transaction
  const receiver = algosdk.mnemonicToSecretKey(process.env.ACC2_MNEMONIC);
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: lsig.address(),
    to: receiver.addr,
    amount: 1e6, // 1 Algo
    suggestedParams,
  });

  // sign with logic signature
  const lstx = algosdk.signLogicSigTransactionObject(txn, lsig);
  await submitToNetwork(lstx.blob);

  const senderBalanceAfter = await algodClient
    .accountInformation(sender.addr)
    .do();

  // 1 Algo + 1000 microAlgos (txn fee)
  console.log(
    "Amount Transacted:",
    senderBalanceBefore.amount - senderBalanceAfter.amount
  );
})();
