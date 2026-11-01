import ConfirmacaoClient from '../../components/ConfirmacaoClient';

export default async function ConfirmacaoPage({ searchParams }) {
  const params = await searchParams;
  return <ConfirmacaoClient pedidoQuery={params?.n || ''} />;
}
