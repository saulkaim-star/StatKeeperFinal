import { useRef } from 'react';
import { Button, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';

const { width } = Dimensions.get('window');

const PlayerCard = ({ player, teamLogo }) => {
    const viewShotRef = useRef();

    if (!player) return null;

    const {
        playerName,
        playerNumber,
        playerPosition,
        photoURL,
        avg,
        ops,
        hits,
    } = player;

    const handleShare = async () => {
        try {
            const uri = await viewShotRef.current.capture();
            const shareOptions = {
                title: 'Share Player Card',
                url: uri,
                failOnCancel: false,
            };
            await Share.open(shareOptions);
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <View style={styles.container}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={styles.cardContainer}>
                {/* Decorative Background Elements */}
                <View style={styles.bgGlow} />

                {/* Header: Team Logo & Player Info */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        {teamLogo ? (
                            <Image source={{ uri: teamLogo }} style={styles.teamLogo} />
                        ) : (
                            <View style={styles.logoPlaceholder}><Text style={styles.logoText}>TEAM</Text></View>
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>{playerName}</Text>
                        <Text style={styles.headerPosition}>{playerPosition} {playerNumber ? `| #${playerNumber}` : ''}</Text>
                    </View>
                </View>

                {/* Main Image */}
                <View style={styles.imageWrapper}>
                    {photoURL ? (
                        <Image source={{ uri: photoURL }} style={styles.playerImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>NO PHOTO</Text>
                        </View>
                    )}
                </View>

                {/* Stats Footer */}
                <View style={styles.statsContainer}>
                    {/* AVG - Green */}
                    <View style={[styles.statBox, styles.statBoxGreen]}>
                        <Text style={styles.statValue}>{avg}</Text>
                        <Text style={styles.statLabel}>AVG</Text>
                    </View>

                    {/* HITS - Orange (Fire) */}
                    <View style={[styles.statBox, styles.statBoxOrange]}>
                        <View style={styles.statBoxFire}><Text style={{ fontSize: 10 }}>🔥</Text></View>
                        <Text style={styles.statValue}>{hits}</Text>
                        <Text style={styles.statLabel}>HITS</Text>
                    </View>

                    {/* OPS - Blue */}
                    <View style={[styles.statBox, styles.statBoxBlue]}>
                        <Text style={styles.statValue}>{ops}</Text>
                        <Text style={styles.statLabel}>OPS</Text>
                    </View>
                </View>

                {/* Branding Footer */}
                <View style={styles.brandingFooter}>
                    <Image source={require('../../assets/icon.png')} style={styles.footerLogo} />
                    <View>
                        <Text style={styles.brandingText}>StatKeeper</Text>
                        <Text style={styles.brandingSubText}>OFFICIAL DATA</Text>
                    </View>
                </View>

            </ViewShot>

            {/* Share Button (Outside ViewShot) */}
            <View style={styles.shareButtonContainer}>
                <Button title="Share to Stories" onPress={handleShare} color="#3b82f6" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
    },
    cardContainer: {
        width: width * 0.9,
        aspectRatio: 9 / 16,
        backgroundColor: '#0f172a', // Dark Navy Background
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
        justifyContent: 'space-between',
        overflow: 'hidden',
        borderWidth: 4, // Thicker Gold Border
        borderColor: 'rgba(234, 179, 8, 0.5)', // Increased opacity for shine
    },
    bgGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    header: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
        marginTop: 10
    },
    logoContainer: {
        width: 80,
        height: 80,
        marginRight: 15,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    teamLogo: { width: '100%', height: '100%' },
    logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoText: { color: 'gray', fontSize: 10 },
    headerInfo: { flex: 1 },
    headerName: { color: 'white', fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
    headerPosition: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginTop: 2 },

    imageWrapper: {
        width: '100%',
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 20,
        marginTop: 5,
        position: 'relative'
    },
    playerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#64748b', fontWeight: 'bold', fontSize: 18 },
    appLogoOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 15,
        width: 40,
        height: 40,
        opacity: 0.5,
        borderRadius: 20
    },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 25
    },
    statBox: {
        width: '31%',
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    statBoxGreen: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    statBoxOrange: { borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.15)' },
    statBoxBlue: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)' },
    statBoxFire: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: '#0f172a', paddingHorizontal: 4, borderRadius: 10 },

    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginBottom: 2,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10
    },
    statLabel: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' },

    brandingFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        justifyContent: 'center'
    },
    footerLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        opacity: 0.6
    },
    brandingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0,
        fontStyle: 'italic',
        lineHeight: 24,
        includeFontPadding: false
    },
    brandingSubText: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 0
    },

    shareButtonContainer: {
        marginTop: 15,
        width: '100%',
        marginBottom: 20
    }
});

export default PlayerCard;
