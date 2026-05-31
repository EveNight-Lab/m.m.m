interface EmptySlotProps {
  onClick?: () => void
  isLoading?: boolean // 로딩 중인지 여부
}

/**
 * 빈 슬롯 컴포넌트
 * 몬스터가 없는 슬롯을 표시합니다.
 * 클릭 시 창조 탭으로 이동할 수 있습니다.
 * isLoading이 true이면 로딩 중 표시를 보여줍니다.
 */
function EmptySlot({ onClick, isLoading = false }: EmptySlotProps) {
  return (
    <div
      className={`bg-white/5 border-2 rounded-xl p-3 md:p-4 xl:p-5 flex flex-col items-center justify-center w-[216px] md:w-[216px] lg:w-[240px] xl:w-[312px] 2xl:w-[360px] shrink-0 transition-all duration-200 aspect-[63/88] ${
        isLoading
          ? 'border-cyan-500/30 border-solid cursor-wait'
          : 'border-dashed border-white/10 cursor-pointer hover:border-white/20 hover:bg-white/10 active:scale-[0.98]'
      }`}
      onClick={isLoading ? undefined : onClick}
    >
      {/* 이미지 영역 (포켓몬 카드 비율 63:88) */}
      <div className="w-full mb-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center aspect-[63/88]">
        {isLoading ? (
          <div className="text-center">
            {/* 로딩 스피너 */}
            <div className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto mb-2">
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="text-center relative w-full h-full flex items-center justify-center">
            {/* 마법진 배경 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 opacity-20">
                {/* 외부 원 */}
                <div className="absolute inset-0 border-2 border-cyan-400/40 rounded-full"></div>
                {/* 내부 원 */}
                <div className="absolute inset-2 border border-violet-400/30 rounded-full"></div>
                {/* 십자가 패턴 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
                  <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-violet-400/30 to-transparent"></div>
                </div>
              </div>
            </div>
            {/* 플러스 아이콘 */}
            <div className="relative z-10 text-cyan-400/40">
              <svg 
                className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 정보 */}
      <div className="text-center flex-none">
        {isLoading ? (
          <p className="text-xs md:text-sm xl:text-base 2xl:text-lg text-cyan-400/80 font-semibold animate-pulse">
            로드 중...
          </p>
        ) : (
          <p className="text-xs md:text-sm xl:text-base 2xl:text-lg text-white/40 font-semibold">빈 슬롯</p>
        )}
      </div>
    </div>
  )
}

export default EmptySlot

