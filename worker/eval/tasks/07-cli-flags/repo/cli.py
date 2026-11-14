import argparse
from data import ROWS
from report import format_report


def main(argv, out):
    parser = argparse.ArgumentParser(prog="report")
    parser.parse_args(argv)
    out.write(format_report(ROWS) + "\n")
    return 0
