import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

const PlayerCard = ({ player }) => {
    if (!player) return null;

    const {
        playerName,
        playerNumber,
        playerPosition,
        photoURL,
        avg,
        homeruns,
        hits,
    } = player;

    return (
        <View style={styles.cardContainer}>
            {/* Header Band */}
            <View style={styles.headerBand}>
                <Text style={styles.teamName}>TEAM STATS</Text>
            </View>

            {/* Main Content */}
            <View style={styles.imageContainer}>
                {photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.playerImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>No Photo</Text>
                    </View>
                )}
            </View>

            {/* Info Overlay */}
            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.playerName}>{playerName || 'Unknown Player'}</Text>
                    <Text style={styles.playerNumber}>#{playerNumber || '00'}</Text>
                </View>
                <Text style={styles.playerPosition}>{playerPosition || 'N/A'}</Text>

                <View style={styles.separator} />

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>AVG</Text>
                        <Text style={styles.statValue}>{avg || '.000'}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>HR</Text>
                        <Text style={styles.statValue}>{homeruns || '0'}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>HITS</Text>
                        <Text style={styles.statValue}>{hits || '0'}</Text>
                    </View>
                </View>
            </View>

            {/* Decorative Elements */}
            <View style={styles.cornerDecorTopLeft} />
            <View style={styles.cornerDecorBottomRight} />
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: width * 0.85,
        backgroundColor: '#1f2937', // Dark slate
        borderRadius: 20,
        overflow: 'hidden',
        alignSelf: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 2,
        borderColor: '#374151',
        aspectRatio: 0.65, // Portrait card ratio
    },
    headerBand: {
        backgroundColor: '#3b82f6', // Bright blue
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: -15,
        zIndex: 10,
        transform: [{ skewY: '-3deg' }],
        marginTop: 10,
        marginHorizontal: -10,
    },
    teamName: {
        color: 'white',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2,
        transform: [{ skewY: '3deg' }], // Counter skew text
    },
    imageContainer: {
        flex: 3,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 15,
        marginBottom: 0,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#4b5563',
    },
    playerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#9ca3af',
    },
    placeholderText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 2,
        padding: 20,
        justifyContent: 'flex-start',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    playerName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        flexWrap: 'wrap',
    },
    playerNumber: {
        color: '#fbbf24', // Amber/Gold
        fontSize: 32,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    playerPosition: {
        color: '#9ca3af',
        fontSize: 16,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#374151',
        marginVertical: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statValue: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    cornerDecorTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderRightWidth: 40,
        borderTopWidth: 40,
        borderRightColor: 'transparent',
        borderTopColor: '#fbbf24', // Gold
    },
    cornerDecorBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 40,
        borderBottomWidth: 40,
        borderLeftColor: 'transparent',
        borderBottomColor: '#3b82f6', // Blue
    },
});

export default PlayerCard;
