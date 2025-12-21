// Email Templates for StatKeeper Onboarding - Simplified Lighter Version

const emailBody = (name) => `
# 🇪🇸 ESPAÑOL

**Asunto:** ¡Gracias por descargar StatKeeper!

Hola ${name},

¡Gracias por descargar **StatKeeper**! Soy **Saúl**, el creador de la app.

Quiero asegurarme de que tengas la mejor experiencia gestionando tu liga o equipo. Si tienes problemas con la configuración o no sabes cómo continuar, **estoy aquí para ayudarte personalmente**.

**¿Necesitas ayuda?**
Simplemente responde a este correo o contáctame por WhatsApp y tendrás soluciones en unos minutos.

**Recursos Útiles:**
Aquí tienes algunos ejemplos de lo que puedes lograr con StatKeeper:
*   **Perfil de Jugador (Modelo):** [Ver Tarjeta de Ejemplo](https://team-web-steel.vercel.app/t/10Eq7V2tmbePVZmq7U2b/roster)
*   **Página de Equipo:** [Ver Equipo Demo](https://team-web-steel.vercel.app/t/10Eq7V2tmbePVZmq7U2b)
*   **Portal de Liga:** [Ver Liga Demo](https://team-web-steel.vercel.app/l/example_league_id)
*   **Web Principal:** [StatKeeper Web](https://statkeeperweb.vercel.app)

¡Espero que disfrutes la app!

Saludos,
**Saúl Kaim**
Creador de StatKeeper

________________________________________________________

# 🇺🇸 ENGLISH

**Subject:** Thanks for downloading StatKeeper!

Hi ${name},

Thanks for downloading **StatKeeper**! I'm **Saul**, the creator of the app.

I want to make sure you have the best experience managing your league or team. If you have any trouble with the setup or don't know how to proceed, **I'm here to help you personally**.

**Need help?**
Simply reply to this email or contact me via WhatsApp, and I'll get you sorted in a few minutes.

**Useful Resources:**
Here are some examples of what you can build with StatKeeper:
*   **Player Card Model:** [View Example Card](https://team-web-steel.vercel.app/t/10Eq7V2tmbePVZmq7U2b/roster)
*   **Team Page:** [View Demo Team](https://team-web-steel.vercel.app/t/10Eq7V2tmbePVZmq7U2b)
*   **League Portal:** [View Demo League](https://team-web-steel.vercel.app/l/example_league_id)
*   **Main Website:** [StatKeeper Web](https://statkeeperweb.vercel.app)

I hope you enjoy the app!

Best regards,
**Saul Kaim**
Creator of StatKeeper

📲 **WhatsApp:** [Chat with me / Chatea conmigo](https://wa.me/972503501207)
`;

exports.organizerTemplate = (organizerName) => emailBody(organizerName);
exports.managerTemplate = (managerName) => emailBody(managerName);
