export default function TestePage() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>✅ Página de Teste Funcionando!</h1>
      <p>Se você está vendo isso, o Next.js está funcionando corretamente.</p>
      <p>O problema está provavelmente em:</p>
      <ul>
        <li>Autenticação (redirecionamento para /login)</li>
        <li>Erro na página /dashboard</li>
        <li>Erro na página /login</li>
      </ul>
      <p>
        <a href="/login" style={{ color: 'blue' }}>Ir para Login</a> | 
        <a href="/dashboard" style={{ color: 'blue' }}>Ir para Dashboard</a>
      </p>
    </div>
  )
}
