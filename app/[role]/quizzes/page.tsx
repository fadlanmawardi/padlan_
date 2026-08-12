import type { Metadata } from "next";
import { QuizManager } from "@/components/teaching/quiz-manager";

export const metadata: Metadata = { title: "Quiz Online" };

export default function QuizzesPage() {
  return <QuizManager />;
}
