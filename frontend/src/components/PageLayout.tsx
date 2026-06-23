import { ReactNode } from "react";
import Footer from "./Footer";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * 페이지 레이아웃 컴포넌트
 * 모든 페이지에서 공통으로 사용되는 레이아웃 구조 제공
 */
function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <div className="w-full min-h-full p-3 sm:p-4 pb-[calc(80px+0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(80px+1rem+env(safe-area-inset-bottom))] box-border">
      {subtitle ? (
        <div className="text-center mb-3 sm:mb-4">
          <h1 className="cosmic-title text-[clamp(1.2rem,4vw,1.6rem)] font-bold my-1.5 sm:my-2 mb-1.5 text-center">
            {title}
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm">{subtitle}</p>
        </div>
      ) : (
        <h1 className="cosmic-title text-[clamp(1.2rem,4vw,1.6rem)] font-bold my-1.5 sm:my-2 mb-3 sm:mb-4 text-center">
          {title}
        </h1>
      )}
      {children}
      <Footer />
    </div>
  );
}

export default PageLayout;
