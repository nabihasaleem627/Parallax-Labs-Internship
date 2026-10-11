import { ConnectionBanner, OfflineBanner } from './realtime-ui';
import type { ConnectionBanner as BannerState } from '../hooks/useProjectRoom';

export function ConnectionBannerBar({ banner }: { banner: BannerState }) {
  return <ConnectionBanner banner={banner} />;
}

export function OfflineBar({ show }: { show: boolean }) {
  return <OfflineBanner show={show} />;
}
