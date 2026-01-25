'use client';

import { useRouter } from 'next/navigation';
import TopicMappingSelector from './TopicMappingSelector';

interface TopicMappingWrapperProps {
  wikipediaTopic: string;
  currentSlug?: string;
}

export default function TopicMappingWrapper({
  wikipediaTopic,
  currentSlug,
}: TopicMappingWrapperProps) {
  const router = useRouter();

  const handleSelect = () => {
    // Reload the page to fetch with the new mapping
    router.refresh();
  };

  return (
    <TopicMappingSelector
      wikipediaTopic={wikipediaTopic}
      currentSlug={currentSlug}
      onSelect={handleSelect}
    />
  );
}
