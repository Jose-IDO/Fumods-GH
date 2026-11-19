export async function readJsonResponse(response: Response) {
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch {
    if (response.status === 413) throw new Error('The image upload is too large. Please try fewer or smaller images.');
    throw new Error(`The upload service returned an unexpected response (${response.status}). Please try again.`);
  }
  if (!response.ok || data.ok === false) {
    throw new Error(typeof data.error === 'string' ? data.error : data.error?.message || `Image request failed (${response.status})`);
  }
  return data;
}
