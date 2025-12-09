from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class DomainConfig:
    name: str
    price_selectors: List[str]
    consent_selectors: List[str]
    wait_selector: Optional[str] = None


DOMAIN_CONFIGS: Dict[str, DomainConfig] = {
    # Example configs – extend as needed
    "www.amazon.com": DomainConfig(
        name="amazon",
        price_selectors=["span.a-offscreen", "span.a-price-whole"],
        consent_selectors=["#sp-cc-accept", "input#sp-cc-accept"],
        wait_selector="span.a-offscreen",
    ),
    "www.bestbuy.com": DomainConfig(
        name="bestbuy",
        price_selectors=["div.priceView-hero-price span"],
        consent_selectors=["button#onetrust-accept-btn-handler"],
        wait_selector="div.priceView-hero-price",
    ),
}


def get_domain_config(hostname: str) -> Optional[DomainConfig]:
    if hostname in DOMAIN_CONFIGS:
        return DOMAIN_CONFIGS[hostname]
    # fallback: try without subdomain
    parts = hostname.split(".")
    if len(parts) > 2:
        root = ".".join(parts[-2:])
        for key, cfg in DOMAIN_CONFIGS.items():
            if key.endswith(root):
                return cfg
    return None
