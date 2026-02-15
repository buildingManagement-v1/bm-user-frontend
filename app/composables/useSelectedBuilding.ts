const COOKIE_NAME = 'selectedBuildingId'

export function useSelectedBuilding() {
  const selectedBuildingId = useCookie<string>(COOKIE_NAME, {
    default: () => '',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
  return { selectedBuildingId }
}
