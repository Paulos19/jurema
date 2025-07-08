'use client';

import { useState } from 'react';

export default function CadastrarCredor() {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    masterKey: '',
    email: '',
    cpf: '',
    password: '',
    whatsapp: '',
    pixKey: '',
    city: '',
    state: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpa erros anteriores

    try {
      const response = await fetch('/api/criar_credor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Credor cadastrado com sucesso!');
        // Reset form or redirect
        setFormData({
            masterKey: '',
            email: '',
            cpf: '',
            password: '',
            whatsapp: '',
            pixKey: '',
            city: '',
            state: ''
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Erro ao cadastrar credor');
      }
    } catch (error) {
      setError('Ocorreu um erro na comunicação com o servidor.');
    }
  };

  return (
    <div className="container">
      <h1>Cadastro de Credor</h1>
      <form onSubmit={handleSubmit}>
        <input type="password" name="masterKey" value={formData.masterKey} onChange={handleInputChange} placeholder="Token de Acesso" required />
        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required />
        <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="CPF" required />
        <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Senha" required />
        <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="WhatsApp" required />
        <input type="text" name="pixKey" value={formData.pixKey} onChange={handleInputChange} placeholder="Chave PIX" required />
        <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Cidade" required />
        <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="Estado" required />
        <button type="submit">Cadastrar</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}