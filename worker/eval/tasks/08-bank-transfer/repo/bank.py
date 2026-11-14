class InsufficientFunds(Exception):
    pass


class Bank:
    def __init__(self, balances):
        self.balances = dict(balances)
        self.log = []

    def transfer(self, src, dst, amount):
        if self.balances[src] < amount:
            raise InsufficientFunds(src)
        self.balances[src] -= amount
        self.balances[dst] += amount
        self.log.append((src, dst, amount))
