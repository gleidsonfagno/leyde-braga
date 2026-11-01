function coordenadasValidas(localizacao) {
  return localizacao && Number.isFinite(localizacao.latitude) && Number.isFinite(localizacao.longitude)
    && Math.abs(localizacao.latitude) <= 90 && Math.abs(localizacao.longitude) <= 180;
}

export function criarLocalizacao(position) {
  const { latitude, longitude, accuracy } = position?.coords || {};
  const timestamp = position?.timestamp;
  if (!coordenadasValidas({ latitude, longitude }) || !Number.isFinite(accuracy) || accuracy < 0
    || !Number.isFinite(timestamp) || !Number.isFinite(new Date(timestamp).getTime())) {
    throw new Error('O aparelho não retornou uma localização válida. Tente novamente ou preencha o endereço.');
  }
  return {
    latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)),
    precisaoMetros: Math.ceil(accuracy), capturadaEm: new Date(timestamp).toISOString(),
  };
}

export function mapaLocalizacao(localizacao) {
  if (!coordenadasValidas(localizacao)) return null;
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', `${localizacao.latitude},${localizacao.longitude}`);
  return url.toString();
}

export function solicitarLocalizacao({ geolocation, secureContext } = {}) {
  if (!secureContext) return Promise.reject(new Error('A localização precisa de uma conexão segura. Você pode continuar preenchendo o endereço.'));
  if (!geolocation?.getCurrentPosition) return Promise.reject(new Error('Este navegador não oferece localização. Preencha o endereço e uma referência para entrega.'));
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition((position) => {
      try { resolve(criarLocalizacao(position)); } catch (error) { reject(error); }
    }, (error) => {
      const mensagens = {
        1: 'A permissão de localização não foi concedida. Você pode permitir nas configurações do navegador ou continuar com o endereço.',
        2: 'Não foi possível localizar seu aparelho. Verifique se a localização está ativada ou preencha o endereço.',
        3: 'A localização demorou para responder. Tente novamente ou continue com o endereço.',
      };
      reject(new Error(mensagens[error?.code] || 'Não foi possível obter a localização. Você pode continuar com o endereço.'));
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  });
}
