import Planner from "@/components/Planner";
import { loadExamples } from "@/lib/examples";

export default function Home() {
  return <Planner examples={loadExamples()} />;
}
