// src/ui/ConfigModal.js
import React from 'react';
import ModalBase from './ModalBase';
import Button from './Button'; // <-- ¡Usamos el componente Button!
// Asume que los estilos base de modal-header/body/footer están globalmente definidos
// o en un archivo ConfigModal.css

function ConfigModal({
  isOpen,
  onRequestClose,
  title,
  children,
  onSave,
  onCancel = onRequestClose, // Default cancel action
  saveText = 'Guardar Cambios',
  size = 'md', // Por defecto, el tamaño "md" que usas en TaxManagement
  isSaving = false, // Para manejar el estado de carga/desactivación
  ...props
}) {
  return (
    <ModalBase 
        isOpen={isOpen} 
        onRequestClose={onRequestClose} 
        size={size}
        // Puedes pasar una clase adicional si es necesario
        // className="config-form-modal"
        {...props}
    >
      
      {/* 1. HEADER ESTRUCTURADO Y CONSISTENTE */}
      <div className="modal-header">
        <div className="modal-title">{title}</div>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel} 
            aria-label="Cerrar"
        >
          {/* Asumiendo que prefieres un icono de cerrar */}
          <i className="fas fa-times" /> 
        </Button>
      </div>

      {/* 2. BODY (Contenido variable del formulario) */}
      <div className="modal-body">
        {children}
      </div>

      {/* 3. FOOTER ESTRUCTURADO Y CONSISTENTE */}
      <div className="modal-footer">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={onSave} 
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : saveText}
        </Button>
      </div>
    </ModalBase>
  );
}

export default ConfigModal;