/**
 * Empty State Component
 * Displays friendly messages when no data is available
 * Provides contextual CTAs to guide users
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact';
}

export const EmptyState = ({
  icon = '📭',
  title,
  description,
  action,
  variant = 'default'
}: EmptyStateProps) => {
  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-center py-8 space-y-2">
        <span className="text-4xl">{icon}</span>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        {description && (
          <p className="text-gray-500 text-xs text-center max-w-xs">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-4 rounded-md transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  // default variant
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 p-8">
      <span className="text-6xl">{icon}</span>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="text-gray-600 text-sm max-w-md">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Preset empty states for common scenarios
 */

export const NoDateSelected = () => (
  <EmptyState
    icon="📅"
    title="날짜를 선택하세요"
    description="캘린더에서 날짜를 선택하면 해당 날짜의 데이트 로그를 확인할 수 있습니다."
    variant="default"
  />
);

export const NoPlaces = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="📍"
    title="등록된 장소가 없습니다"
    description="이 지역에 방문한 카페, 레스토랑, 명소를 추가해보세요."
    action={onAdd ? { label: '장소 추가하기', onClick: onAdd } : undefined}
    variant="compact"
  />
);

export const NoRegions = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="🗺️"
    title="지역을 추가하세요"
    description="데이트 코스에서 방문한 지역을 추가하고 장소를 기록해보세요."
    action={onAdd ? { label: '지역 추가하기', onClick: onAdd } : undefined}
    variant="default"
  />
);

export const NoSearchResults = () => (
  <EmptyState
    icon="🔍"
    title="검색 결과가 없습니다"
    description="다른 검색어로 다시 시도해보세요."
    variant="compact"
  />
);

export const NoDates = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="💝"
    title="아직 기록된 데이트가 없습니다"
    description="첫 데이트 코스를 기록해보세요. 소중한 추억을 남길 수 있습니다."
    action={onAdd ? { label: '첫 데이트 기록하기', onClick: onAdd } : undefined}
    variant="default"
  />
);
