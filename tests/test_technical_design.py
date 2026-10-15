from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
PRODUCT_DESIGN = ROOT / "PRODUCT_DESIGN.md"
TECHNICAL_DESIGN = ROOT / "docs" / "TECHNICAL_DESIGN.md"


class TechnicalDesignContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.product = PRODUCT_DESIGN.read_text(encoding="utf-8")
        cls.technical = TECHNICAL_DESIGN.read_text(encoding="utf-8")

    def test_required_documents_exist_and_are_not_empty(self) -> None:
        self.assertTrue(self.product.strip())
        self.assertTrue(self.technical.strip())

    def test_selected_stack_is_recorded(self) -> None:
        required_terms = [
            "React",
            "TypeScript",
            "Vite",
            "IndexedDB",
            "Dexie",
            "PWA",
            "Vitest",
            "Playwright",
        ]
        for term in required_terms:
            with self.subTest(term=term):
                self.assertIn(term, self.technical)

    def test_product_course_and_attendance_states_are_mapped(self) -> None:
        course_states = ["pending", "held", "all_absent", "cancelled"]
        attendance_states = ["present", "late", "leave", "absent"]
        for state in course_states + attendance_states:
            with self.subTest(state=state):
                self.assertRegex(self.technical, rf"`{re.escape(state)}`")

    def test_local_persistence_and_data_portability_are_covered(self) -> None:
        required_topics = [
            "Service Worker",
            "CSV",
            "完整 JSON 备份",
            "恢复",
            "数据库 schema 迁移",
        ]
        for topic in required_topics:
            with self.subTest(topic=topic):
                self.assertIn(topic, self.technical)

    def test_mvp_exclusions_remain_explicit(self) -> None:
        exclusions = ["云端同步", "账号", "照片", "通知"]
        for exclusion in exclusions:
            with self.subTest(exclusion=exclusion):
                self.assertIn(exclusion, self.technical)

    def test_open_product_questions_are_visible(self) -> None:
        self.assertIn("## 14. 待产品确认的问题", self.technical)
        numbered_questions = re.findall(r"^\d+\. .+", self.technical, re.MULTILINE)
        self.assertGreaterEqual(len(numbered_questions), 5)


if __name__ == "__main__":
    unittest.main()
