import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { type EmotionScore } from "@/types/social";

interface EmotionSummaryProps {
  emotions: EmotionScore[];
  title?: string;
}

export function EmotionSummary({ emotions, title = "Distribución emocional" }: EmotionSummaryProps) {
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {emotions.length ? (
        <div className="space-y-3">
          {emotions.map((item) => (
            <ProgressBar key={item.emotion} value={item.percentage} label={`${item.emotion} (${item.count})`} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No hay suficientes comentarios analizados para mostrar tendencias.</p>
      )}
    </Card>
  );
}


