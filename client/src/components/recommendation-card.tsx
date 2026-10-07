import type { Recommendation } from "../api/jobs";
import { JobCard } from "./job-card";

type Props = {
  recommendation: Recommendation;
  saving: boolean;
  tracking: boolean;
  onSave: () => void;
  onTrack: () => void;
};

export function RecommendationCard({ recommendation, saving, tracking, onSave, onTrack }: Props) {
  return <JobCard job={recommendation.job} saved={recommendation.state.saved} saving={saving} onSave={onSave} match={recommendation.match} applicationStatus={recommendation.state.applicationStatus} tracking={tracking} onTrack={onTrack} />;
}
