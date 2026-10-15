import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class VercelDeploymentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        cls.package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

    def test_static_build_contract(self) -> None:
        self.assertEqual(self.config["framework"], "vite")
        self.assertEqual(self.config["outputDirectory"], "dist")
        self.assertEqual(self.config["buildCommand"], "pnpm build")
        self.assertIn("build", self.package["scripts"])

    def test_spa_routes_fall_back_to_index(self) -> None:
        self.assertIn(
            {"source": "/((?!.*\\.).*)", "destination": "/index.html"},
            self.config["rewrites"],
        )


if __name__ == "__main__":
    unittest.main()
