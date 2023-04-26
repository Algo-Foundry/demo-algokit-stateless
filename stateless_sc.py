from pyteal import *


def stateless_sc():
    def basic_checks(txn: Txn):
        return And(
            txn.rekey_to() == Global.zero_address(),
            txn.close_remainder_to() == Global.zero_address(),
        )

    """
    Check if txn amount is less than 1 Algo and the correct receiver
    """
    program = And(
        basic_checks(Txn),
        Txn.amount() <= Int(1000000),
        Txn.receiver()
        == Addr("U2C455RC4GUXJCLBLMKPQ4WOYDG3HQNUYDXKTQQQGIC67REIA7CRBRNID4"),
    )

    return program


if __name__ == "__main__":
    stateless_sc = compileTeal(stateless_sc(), mode=Mode.Signature, version=8)
    with open("./artifacts/stateless_sc.teal", "w") as f:
        f.write(stateless_sc)
