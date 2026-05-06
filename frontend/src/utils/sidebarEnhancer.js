// Sidebar User Profile Enhancement Script
// Applies glassmorphism and depth effects to sidebar user profile

const setElementStyles = async (element, styles) => {
  if (!element) return;
  
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property] = value;
  });
};

const enhanceSidebarUserProfile = async () => {
  try {
    // Get all sidebar elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarUser = document.querySelector('.sidebar-user');
    const avatar = document.querySelector('.sidebar-user .avatar');
    const userMeta = document.querySelector('.user-meta');
    const email = document.querySelector('.user-email');
    const role = document.querySelector('.role-badge');

    // Apply glassmorphism to main sidebar
    if (sidebar) {
      await setElementStyles(sidebar, {
        'background': 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        'box-shadow': '4px 0 10px rgba(0,0,0,0.1)'
      });
    }

    // Enhanced user profile container with glassmorphism
    if (sidebarUser) {
      await setElementStyles(sidebarUser, {
        'background': 'rgba(255, 255, 255, 0.03)',
        'margin': '10px 12px 20px 12px',
        'border-radius': '12px',
        'border': '1px solid rgba(255, 255, 255, 0.05)',
        'transition': 'all 0.3s ease',
        'cursor': 'pointer',
        'backdrop-filter': 'blur(10px)',
        'position': 'relative',
        'overflow': 'hidden'
      });

      // Add subtle animated background gradient
      const gradientOverlay = document.createElement('div');
      gradientOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
          rgba(74, 222, 128, 0.03) 0%, 
          rgba(34, 197, 94, 0.02) 50%, 
          rgba(15, 139, 141, 0.03) 100%);
        pointer-events: none;
        transition: opacity 0.3s ease;
        opacity: 0;
      `;
      sidebarUser.appendChild(gradientOverlay);

      // Show gradient on hover
      sidebarUser.addEventListener('mouseenter', () => {
        gradientOverlay.style.opacity = '1';
      });
      
      sidebarUser.addEventListener('mouseleave', () => {
        gradientOverlay.style.opacity = '0';
      });
    }

    // Enhanced avatar with depth and glow effects
    if (avatar) {
      await setElementStyles(avatar, {
        'width': '36px',
        'height': '36px',
        'background-color': '#4ade80',
        'color': '#064e3b',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'border-radius': '8px',
        'font-weight': 'bold',
        'flex-shrink': '0',
        'box-shadow': '0 0 15px rgba(74, 222, 128, 0.2)',
        'border': '2px solid rgba(74, 222, 128, 0.1)',
        'font-family': 'system-ui, -apple-system, sans-serif',
        'position': 'relative',
        'z-index': '2',
        'transition': 'all 0.3s ease'
      });

      // Add pulse animation on avatar
      avatar.addEventListener('mouseenter', () => {
        avatar.style.transform = 'scale(1.05)';
        avatar.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.3)';
      });
      
      avatar.addEventListener('mouseleave', () => {
        avatar.style.transform = 'scale(1)';
        avatar.style.boxShadow = '0 0 15px rgba(74, 222, 128, 0.2)';
      });
    }

    // Enhanced user meta layout
    if (userMeta) {
      await setElementStyles(userMeta, {
        'display': 'flex',
        'flex-direction': 'column',
        'gap': '2px',
        'overflow': 'hidden',
        'position': 'relative',
        'z-index': '1'
      });
    }

    // Enhanced email styling
    if (email) {
      await setElementStyles(email, {
        'font-size': '13px',
        'color': '#f8fafc',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'text-overflow': 'ellipsis',
        'font-weight': '500',
        'opacity': '0.9',
        'transition': 'all 0.2s ease'
      });

      // Highlight email on hover
      email.addEventListener('mouseenter', () => {
        email.style.opacity = '1';
        email.style.color = '#ffffff';
      });
      
      email.addEventListener('mouseleave', () => {
        email.style.opacity = '0.9';
        email.style.color = '#f8fafc';
      });
    }

    // Enhanced role badge with glassmorphism
    if (role) {
      await setElementStyles(role, {
        'font-size': '11px',
        'text-transform': 'uppercase',
        'letter-spacing': '0.05em',
        'color': '#4ade80',
        'font-weight': '700',
        'background': 'rgba(74, 222, 128, 0.1)',
        'padding': '2px 8px',
        'border-radius': '20px',
        'display': 'inline-flex',
        'width': 'fit-content',
        'backdrop-filter': 'blur(5px)',
        'border': '1px solid rgba(74, 222, 128, 0.2)',
        'position': 'relative',
        'transition': 'all 0.3s ease'
      });

      // Add subtle glow effect on hover
      role.addEventListener('mouseenter', () => {
        role.style.background = 'rgba(74, 222, 128, 0.15)';
        role.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.3)';
        role.style.borderColor = 'rgba(74, 222, 128, 0.3)';
      });
      
      role.addEventListener('mouseleave', () => {
        role.style.background = 'rgba(74, 222, 128, 0.1)';
        role.style.boxShadow = 'none';
        role.style.borderColor = 'rgba(74, 222, 128, 0.2)';
      });
    }

    console.log('✅ Sidebar user profile enhanced with glassmorphism and depth effects');
    return { status: "UI further improved with glassmorphism and depth" };

  } catch (error) {
    console.error('❌ Error enhancing sidebar user profile:', error);
    return { status: "Error applying enhancements", error: error.message };
  }
};

// Auto-apply when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceSidebarUserProfile);
} else {
  enhanceSidebarUserProfile();
}

// Export for manual use
window.enhanceSidebarUserProfile = enhanceSidebarUserProfile;
