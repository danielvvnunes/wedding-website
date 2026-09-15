const unavailableMessage = "O serviço de emails não está disponível neste ambiente. Podes continuar a consultar e organizar as mesas.";

export async function readTableEmailResponse(response, { expectJobs = false } = {}) {
  let data;
  try {
    data = await response.json();
  } catch {
    // Local Vite and SPA rewrites can return index.html with HTTP 200.
    throw new Error(unavailableMessage);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(unavailableMessage);
  }
  if (!response.ok || data.error) {
    throw new Error(typeof data.error === "string" ? data.error : "Não foi possível contactar o serviço de emails.");
  }
  if (expectJobs && (!Array.isArray(data.jobs) || !data.jobs.every(isValidJob))) {
    throw new Error("Não foi possível carregar o estado dos emails: o serviço devolveu uma resposta inválida. Podes tentar novamente.");
  }
  return data;
}

function isValidJob(job) {
  return job && typeof job === "object"
    && typeof job.id === "string"
    && typeof job.email === "string"
    && typeof job.status === "string"
    && typeof job.scheduled_at === "string"
    && Number.isFinite(Date.parse(job.scheduled_at))
    && (job.error == null || typeof job.error === "string");
}
