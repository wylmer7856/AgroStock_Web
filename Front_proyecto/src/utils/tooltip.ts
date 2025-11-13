// Utilidad para deshabilitar tooltips nativos y crear tooltips personalizados MUY PEQUEÑOS

export const initSmallTooltips = () => {
  // Deshabilitar tooltips nativos del navegador de forma agresiva
  document.querySelectorAll('[title]').forEach((element) => {
    const title = element.getAttribute('title');
    if (title && title.trim() !== '') {
      // Guardar el título en un data attribute
      element.setAttribute('data-custom-title', title);
      // Remover el atributo title para deshabilitar el tooltip nativo
      element.removeAttribute('title');
      // Agregar clase para estilos
      element.classList.add('custom-tooltip');
    }
  });
};

// Reinicializar cuando se agreguen nuevos elementos
export const observeTooltips = () => {
  const observer = new MutationObserver(() => {
    // Ejecutar después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      initSmallTooltips();
    }, 10);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['title']
  });
};

// Ejecutar inmediatamente y también después de que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSmallTooltips);
} else {
  initSmallTooltips();
}

