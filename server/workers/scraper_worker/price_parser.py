from __future__ import annotations

import re
from typing import Optional, Tuple


CURRENCY_SYMBOLS = {
    "$": "USD",
    "€": "EUR",
    "£": "GBP",
}


def extract_price_and_currency(text: str) -> Tuple[Optional[float], Optional[str]]:
    if not text:
        return None, None

    currency = None
    for symbol, code in CURRENCY_SYMBOLS.items():
        if symbol in text:
            currency = code
            break

    # find first number-like token
    match = re.search(r"([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)", text)
    if not match:
        return None, currency

    numeric = match.group(1).replace(",", "").replace(" ", "")
    try:
        value = float(numeric)
    except ValueError:
        return None, currency

    if value <= 0 or value > 1_000_000:
        return None, currency

    return value, currency


def normalize_to_usd(amount: Optional[float], currency: Optional[str], fx_rates: dict[str, float]) -> Optional[float]:
    if amount is None:
        return None
    if currency is None or currency.upper() == "USD":
        return amount

    rate = fx_rates.get(currency.upper())
    if not rate or rate <= 0:
        return None
    return float(amount) * float(rate)
