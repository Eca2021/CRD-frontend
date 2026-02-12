import React from 'react';

function HomePage({ username, userRoles }) {
  const rolesText = (userRoles || []).join(', ');

  return (
    <div style={{ padding: '1.5rem' }}>
      {username && <p>Hola, <strong>{username}</strong>.</p>}
      {rolesText && <p>Roles asignados: {rolesText}</p>}
      <p>
        Selecciona una opción del menú de la izquierda para comenzar a trabajar.
      </p>
    </div>
  );
}

export default HomePage;