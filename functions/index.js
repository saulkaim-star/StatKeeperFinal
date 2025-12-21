const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const config = require("./config");
const { organizerTemplate, managerTemplate } = require("./templates");

admin.initializeApp();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.email,
        pass: config.password,
    },
});

exports.sendWelcomeEmail = functions.runWith({
    timeoutSeconds: 300,
    memory: "128MB"
}).auth.user().onCreate(async (user) => {
    const email = user.email;
    const name = user.displayName || "Usuario";
    const uid = user.uid;

    if (!email) {
        console.log("No email for user", uid);
        return null;
    }

    console.log(`New user created: ${email} (${uid}). Waiting 120 seconds...`);

    // 1. Wait 2 minutes (120,000 ms)
    await new Promise((resolve) => setTimeout(resolve, 120000));

    try {
        // 2. Fetch User Role from Firestore
        // We assume that within 2 minutes, the client app has created the user document in Firestore.
        const userDoc = await admin.firestore().collection("users").doc(uid).get();

        if (!userDoc.exists) {
            console.log(`User document not found for ${uid} after 2 minutes.`);
            // Fallback: Send Manager template or generic? Let's default to Manager as it's safer/more common, 
            // or maybe abort if we want to be strict. Given the "Growth" goal, let's send Manager.
            // But let's log it.
        }

        const userData = userDoc.exists ? userDoc.data() : {};
        const role = userData.role || "Manager"; // Default to Manager if missing

        console.log(`User ${email} has role: ${role}`);

        // 3. Select Template
        let emailContent = "";
        let subject = "";

        // Normalize role check (case insensitive)
        const roleLower = role.toLowerCase();

        if (roleLower.includes("organiza") || roleLower.includes("admin")) {
            emailContent = organizerTemplate(name);
            subject = "⚾ Desbloquea todo el potencial de tu liga en StatKeeper";
        } else {
            // Default for Managers, Players, or others
            emailContent = managerTemplate(name);
            subject = "⚾ Desbloquea todo el potencial de tu equipo en StatKeeper";
        }

        // 4. Send Email
        const mailOptions = {
            from: `"Saúl de StatKeeper" <${config.email}>`,
            to: email,
            subject: subject,
            text: emailContent, // Fallback plain text
            html: emailContent.replace(/\n/g, '<br/>') // Simple markdown-to-html conversion for newlines
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/# 🇪🇸 ESPAÑOL/g, '<h2>🇪🇸 ESPAÑOL</h2>')
                .replace(/# 🇺🇸 ENGLISH/g, '<h2>🇺🇸 ENGLISH</h2>') // Basic formatting
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email} as ${role}`);

    } catch (error) {
        console.error("Error sending welcome email:", error);
    }

    return null;
});
