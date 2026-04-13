"""
CLI entry point to assign a task to a team.

Usage:
    python tools/run_team.py <team_id> "<free-form task description>"
    python tools/run_team.py <team_id> --brief path/to/brief.json
    python tools/run_team.py --list

Examples:
    python tools/run_team.py content_team "Write a blog post about AI ethics"
    python tools/run_team.py research_team --brief .tmp/my_brief.json
"""

import argparse
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agent_orchestrator import TEAMS_DIR, run_team


def list_teams():
    """Print all available teams."""
    paths = sorted(glob.glob(os.path.join(TEAMS_DIR, "*.yaml")))
    paths = [p for p in paths if not os.path.basename(p).startswith("_")]

    if not paths:
        print("No teams defined. Create one from teams/_template.yaml")
        return

    print("Available teams:")
    for p in paths:
        team_id = os.path.splitext(os.path.basename(p))[0]
        print(f"  - {team_id}")


def main():
    parser = argparse.ArgumentParser(description="Assign a task to an agentic team.")
    parser.add_argument("team_id", nargs="?", help="Team identifier (filename without .yaml)")
    parser.add_argument("task", nargs="?", help="Free-form task description")
    parser.add_argument("--brief", help="Path to a JSON file with a structured brief")
    parser.add_argument("--list", action="store_true", help="List available teams")

    args = parser.parse_args()

    if args.list:
        list_teams()
        return

    if not args.team_id:
        parser.print_help()
        sys.exit(1)

    # Resolve task input: either --brief JSON file or positional free-form string
    if args.brief:
        if not os.path.exists(args.brief):
            print(f"Error: brief file not found: {args.brief}")
            sys.exit(1)
        with open(args.brief) as f:
            task = json.load(f)
    elif args.task:
        task = args.task
    else:
        print("Error: provide either a task string or --brief <path>")
        sys.exit(1)

    result = run_team(args.team_id, task)

    # Print the final result payload
    print("\n--- FINAL RESULT ---")
    print(json.dumps(result.get("result", result), indent=2))


if __name__ == "__main__":
    main()
