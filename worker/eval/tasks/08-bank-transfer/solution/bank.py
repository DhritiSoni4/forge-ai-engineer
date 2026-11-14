class InsufficientFunds(Exception):
    pass


class Bank:
    def __init__(self, balances):
        self.balances = dict(balances)
        self.log = []

    def transfer(self, src, dst, amount):
        if not isinstance(amount, int) or isinstance(amount, bool) or amount <= 0:
            raise ValueError("amount must be a positive int")
        if src == dst:
            raise ValueError("src and dst must differ")
        if src not in self.balances or dst not in self.balances:
            raise KeyError(src if src not in self.balances else dst)
        if self.balances[src] < amount:
            raise InsufficientFunds(src)
        self.balances[src] -= amount
        self.balances[dst] += amount
        self.log.append((src, dst, amount))
