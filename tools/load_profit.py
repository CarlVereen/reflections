#!/usr/bin/env python3
"""
load_profit.py  --  True rate-per-mile / load-profitability calculator
for owner-operators.

The question this answers on every load:
    "After ALL my costs -- not just fuel -- does this load actually
     make me money, and what is my REAL rate per mile?"

Most owner-operators quote off gross rate-per-mile and forget fixed
costs (truck payment, insurance, permits) and deadhead miles. This tool
folds every cost in and tells you accept / reject against a target
profit margin.

No external dependencies -- runs on a plain Python 3 install.

USAGE
-----
Quick check on a single load (uses the default cost profile below):

    python3 tools/load_profit.py --revenue 1800 --loaded-miles 620 --deadhead-miles 90

Save your own truck's numbers once, then reuse them:

    python3 tools/load_profit.py --save-profile my_truck.json \\
        --truck-payment 1800 --insurance 1200 --annual-miles 110000 --mpg 6.5

    python3 tools/load_profit.py --profile my_truck.json \\
        --revenue 1800 --loaded-miles 620 --deadhead-miles 90

Run with no args to see a worked example.
"""

import argparse
import json
import sys

# ---------------------------------------------------------------------------
# Default cost profile. These are illustrative middle-of-the-road numbers for
# a single Class-8 tractor. REPLACE them with your real figures (or save a
# profile with --save-profile) -- garbage in, garbage out.
# ---------------------------------------------------------------------------
DEFAULT_PROFILE = {
    # --- Monthly FIXED costs (you pay these whether the truck rolls or not) ---
    "truck_payment_monthly": 1800.0,   # truck/trailer note or lease
    "insurance_monthly": 1200.0,       # liability + physical damage + cargo
    "permits_licenses_monthly": 250.0, # IFTA, plates, IRP, ELD subscription, UCR
    "parking_monthly": 200.0,          # yard / truck parking
    "accounting_admin_monthly": 300.0, # bookkeeping, factoring base fee, phone

    # --- Per-mile VARIABLE costs ---
    "mpg": 6.5,                        # your real average, loaded + empty
    "fuel_price_per_gal": 3.90,        # current diesel price you pay
    "maintenance_per_mile": 0.18,      # tires, PM, repairs reserve
    "def_per_mile": 0.02,              # diesel exhaust fluid

    # --- Your pay & planning assumptions ---
    "driver_pay_per_mile": 0.60,       # PAY YOURSELF -- most people skip this
    "annual_miles": 110000,            # realistic paid+empty miles/year
    "target_margin_pct": 15.0,         # profit % you want on top of true cost
}


def build_cost_model(p):
    """Turn a profile into a per-mile cost model."""
    annual_miles = max(1, p["annual_miles"])

    fixed_monthly = (
        p["truck_payment_monthly"]
        + p["insurance_monthly"]
        + p["permits_licenses_monthly"]
        + p["parking_monthly"]
        + p["accounting_admin_monthly"]
    )
    fixed_annual = fixed_monthly * 12.0
    fixed_per_mile = fixed_annual / annual_miles

    fuel_per_mile = p["fuel_price_per_gal"] / max(0.1, p["mpg"])
    variable_per_mile = (
        fuel_per_mile
        + p["maintenance_per_mile"]
        + p["def_per_mile"]
    )

    driver_per_mile = p["driver_pay_per_mile"]

    total_per_mile = fixed_per_mile + variable_per_mile + driver_per_mile
    return {
        "fixed_per_mile": fixed_per_mile,
        "fuel_per_mile": fuel_per_mile,
        "variable_per_mile": variable_per_mile,
        "driver_per_mile": driver_per_mile,
        "total_cost_per_mile": total_per_mile,
        "fixed_monthly": fixed_monthly,
    }


def evaluate_load(p, revenue, loaded_miles, deadhead_miles):
    """Evaluate one load against the cost model."""
    model = build_cost_model(p)
    total_miles = max(1.0, loaded_miles + deadhead_miles)

    total_cost = model["total_cost_per_mile"] * total_miles
    profit = revenue - total_cost

    # Rate-per-mile the way brokers quote it (loaded only) vs. reality (all miles)
    gross_rpm_loaded = revenue / max(1.0, loaded_miles)
    true_rpm_all = revenue / total_miles

    # Break-even rate you must clear on ALL miles to not lose money.
    breakeven_rpm = model["total_cost_per_mile"]

    # Rate you'd need to hit your target margin.
    margin = p["target_margin_pct"] / 100.0
    target_total = total_cost * (1.0 + margin)
    target_rpm_all = target_total / total_miles

    margin_pct = (profit / revenue * 100.0) if revenue else 0.0

    if true_rpm_all >= target_rpm_all:
        verdict = "TAKE IT"
    elif true_rpm_all >= breakeven_rpm:
        verdict = "THIN -- covers cost but below your target margin"
    else:
        verdict = "PASS -- you LOSE money on this load"

    return {
        "model": model,
        "total_miles": total_miles,
        "total_cost": total_cost,
        "profit": profit,
        "margin_pct": margin_pct,
        "gross_rpm_loaded": gross_rpm_loaded,
        "true_rpm_all": true_rpm_all,
        "breakeven_rpm": breakeven_rpm,
        "target_rpm_all": target_rpm_all,
        "verdict": verdict,
    }


def money(x):
    return f"${x:,.2f}"


def rpm(x):
    return f"${x:,.3f}/mi"


def print_report(p, revenue, loaded_miles, deadhead_miles, r):
    m = r["model"]
    line = "-" * 60
    print(line)
    print("  LOAD PROFITABILITY CHECK")
    print(line)
    print(f"  Revenue offered         {money(revenue)}")
    print(f"  Loaded miles            {loaded_miles:,.0f}")
    print(f"  Deadhead (empty) miles  {deadhead_miles:,.0f}")
    print(f"  Total miles             {r['total_miles']:,.0f}")
    print(line)
    print("  YOUR COST PER MILE")
    print(f"    Fixed (note/ins/etc)  {rpm(m['fixed_per_mile'])}")
    print(f"    Fuel                  {rpm(m['fuel_per_mile'])}")
    print(f"    Maint + DEF           {rpm(m['variable_per_mile'] - m['fuel_per_mile'])}")
    print(f"    Your pay              {rpm(m['driver_per_mile'])}")
    print(f"    -> TOTAL COST/MILE    {rpm(m['total_cost_per_mile'])}")
    print(line)
    print("  THE NUMBERS THAT MATTER")
    print(f"    Broker's rate (loaded only)   {rpm(r['gross_rpm_loaded'])}")
    print(f"    Your TRUE rate (all miles)    {rpm(r['true_rpm_all'])}")
    print(f"    Break-even rate               {rpm(r['breakeven_rpm'])}")
    print(f"    Rate for {p['target_margin_pct']:.0f}% target margin    {rpm(r['target_rpm_all'])}")
    print(line)
    print(f"    Total cost of this load       {money(r['total_cost'])}")
    print(f"    PROFIT                        {money(r['profit'])}  ({r['margin_pct']:.1f}%)")
    print(line)
    print(f"  VERDICT: {r['verdict']}")
    print(line)


def load_profile(path):
    with open(path, "r") as f:
        data = json.load(f)
    p = dict(DEFAULT_PROFILE)
    p.update(data)
    return p


def apply_overrides(p, args):
    mapping = {
        "truck_payment": "truck_payment_monthly",
        "insurance": "insurance_monthly",
        "permits": "permits_licenses_monthly",
        "parking": "parking_monthly",
        "accounting": "accounting_admin_monthly",
        "mpg": "mpg",
        "fuel_price": "fuel_price_per_gal",
        "maintenance_per_mile": "maintenance_per_mile",
        "driver_pay": "driver_pay_per_mile",
        "annual_miles": "annual_miles",
        "target_margin": "target_margin_pct",
    }
    for arg_name, key in mapping.items():
        val = getattr(args, arg_name, None)
        if val is not None:
            p[key] = val
    return p


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="True rate-per-mile / load-profitability calculator for owner-operators.")
    # Load specifics
    ap.add_argument("--revenue", type=float, help="Dollar amount the broker is paying for the load")
    ap.add_argument("--loaded-miles", type=float, help="Loaded (paid) miles")
    ap.add_argument("--deadhead-miles", type=float, default=0.0, help="Empty miles to get to pickup")

    # Profile I/O
    ap.add_argument("--profile", help="Path to a saved cost-profile JSON")
    ap.add_argument("--save-profile", help="Write current profile (defaults + overrides) to this path and exit")

    # Cost overrides (all optional)
    ap.add_argument("--truck-payment", dest="truck_payment", type=float)
    ap.add_argument("--insurance", type=float)
    ap.add_argument("--permits", type=float)
    ap.add_argument("--parking", type=float)
    ap.add_argument("--accounting", type=float)
    ap.add_argument("--mpg", type=float)
    ap.add_argument("--fuel-price", dest="fuel_price", type=float)
    ap.add_argument("--maintenance-per-mile", dest="maintenance_per_mile", type=float)
    ap.add_argument("--driver-pay", dest="driver_pay", type=float)
    ap.add_argument("--annual-miles", dest="annual_miles", type=float)
    ap.add_argument("--target-margin", dest="target_margin", type=float)

    args = ap.parse_args(argv)

    p = load_profile(args.profile) if args.profile else dict(DEFAULT_PROFILE)
    p = apply_overrides(p, args)

    if args.save_profile:
        with open(args.save_profile, "w") as f:
            json.dump(p, f, indent=2)
        print(f"Saved cost profile to {args.save_profile}")
        return 0

    # Worked example if no load given.
    if args.revenue is None or args.loaded_miles is None:
        print("No load provided -- showing a WORKED EXAMPLE with default costs.\n"
              "(Replace defaults with your real numbers: see --help)\n")
        revenue, loaded, dead = 1800.0, 620.0, 90.0
    else:
        revenue, loaded, dead = args.revenue, args.loaded_miles, args.deadhead_miles

    r = evaluate_load(p, revenue, loaded, dead)
    print_report(p, revenue, loaded, dead, r)
    return 0


if __name__ == "__main__":
    sys.exit(main())
