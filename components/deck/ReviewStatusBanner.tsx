import Image from 'next/image';
import Link from 'next/link';

interface ReviewStatusBannerProps {
  totalDueCount: number;
  firstDueDeckId: string | null;
}

export function ReviewStatusBanner({ totalDueCount, firstDueDeckId }: ReviewStatusBannerProps) {
  if (totalDueCount > 0) {
    return (
      <section
        className="py-8 border-b border-base-300 mb-10"
        aria-live="polite"
        aria-label="Review status"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">
              pending_actions
            </span>
            <div>
              <span className="font-semibold">Ready for Review</span>
              <span className="ml-2 text-base-content/70">
                <strong>{totalDueCount}</strong> {totalDueCount === 1 ? 'card' : 'cards'} due
              </span>
            </div>
          </div>
          {firstDueDeckId && (
            <Link href={`/decks/${firstDueDeckId}/study`} className="btn btn-primary btn-sm">
              Start Reviewing
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 border-b border-base-300 mb-10" aria-label="Review status">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/assets/all-caught-up.svg"
          alt=""
          width={80}
          height={60}
        />
        <h2 className="text-lg font-bold tracking-tight mt-3">All Caught Up</h2>
        <p className="text-base-content/70 text-sm mt-1">
          No cards due right now. Check back later.
        </p>
      </div>
    </section>
  );
}
