export interface UpdateCheckOperationResponse {
  update: boolean,
  updateData?: DownloadableUpdate
}

export type DownloadableUpdate = {
  version: string,
  url: string,
  size: number
}
