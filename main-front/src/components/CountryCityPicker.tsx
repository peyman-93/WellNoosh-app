import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, Alert } from 'react-native';

// Sample data - in production, you'd fetch this from an API
const COUNTRIES_CITIES = {
  "United States": {
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Boston", "El Paso", "Detroit", "Nashville", "Portland", "Memphis", "Oklahoma City", "Las Vegas", "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City", "Mesa", "Atlanta", "Colorado Springs", "Omaha", "Raleigh", "Miami", "Long Beach", "Virginia Beach", "Oakland", "Minneapolis", "Tulsa", "Tampa", "Arlington", "New Orleans"],
    code: "US"
  },
  "Canada": {
    cities: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "St. Catharines", "Regina", "Kelowna", "Barrie", "Sherbrooke", "Guelph", "Kanata", "Abbotsford", "Trois-Rivières", "Kingston", "Milton", "Moncton", "White Rock", "Nanaimo", "Brantford", "Chicoutimi", "Saint-Jérôme", "Red Deer", "Thunder Bay"],
    code: "CA"
  },
  "United Kingdom": {
    cities: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Cardiff", "Leicester", "Coventry", "Bradford", "Belfast", "Nottingham", "Hull", "Newcastle", "Stoke-on-Trent", "Southampton", "Derby", "Portsmouth", "Brighton", "Plymouth", "Reading", "Luton", "Wolverhampton", "Bolton", "Bournemouth", "Norwich", "Swindon", "Swansea", "Southend", "Middlesbrough", "Peterborough", "Cambridge"],
    code: "GB"
  },
  "Australia": {
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast", "Wollongong", "Hobart", "Geelong", "Townsville", "Cairns", "Toowoomba", "Darwin", "Ballarat", "Bendigo", "Albury", "Launceston", "Mackay", "Rockhampton", "Bunbury", "Bundaberg", "Coffs Harbour", "Wagga Wagga", "Hervey Bay", "Mildura", "Shepparton", "Port Macquarie"],
    code: "AU"
  },
  "Germany": {
    cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden", "Gelsenkirchen", "Mönchengladbach", "Braunschweig", "Chemnitz", "Kiel", "Aachen"],
    code: "DE"
  },
  "France": {
    cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Saint-Denis", "Le Mans", "Aix-en-Provence", "Clermont-Ferrand", "Brest", "Tours", "Limoges", "Amiens", "Perpignan", "Metz"],
    code: "FR"
  },
  "Italy": {
    cities: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Parma", "Prato", "Modena", "Reggio Calabria", "Reggio Emilia", "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara"],
    code: "IT"
  },
  "Spain": {
    cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Hospitalet", "A Coruña", "Granada", "Vitoria", "Elche", "Oviedo", "Badalona", "Cartagena", "Terrassa", "Jerez", "Sabadell", "Móstoles", "Santa Cruz", "Pamplona", "Almería"],
    code: "ES"
  },
  "Netherlands": {
    cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem", "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "Haarlemmermeer", "Den Bosch", "Zwolle", "Zoetermeer", "Maastricht", "Dordrecht", "Leiden", "Emmen", "Westland", "Delft", "Venlo", "Alkmaar", "Leeuwarden", "Hilversum"],
    code: "NL"
  },
  "Belgium": {
    cities: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "La Louvière", "Kortrijk", "Hasselt", "Sint-Niklaas", "Ostend", "Genk", "Seraing", "Roeselare", "Mouscron", "Verviers", "Beveren", "Dendermonde", "Beringen", "Turnhout", "Vilvoorde", "Lokeren", "Sint-Truiden", "Herstal", "Brasschaat"],
    code: "BE"
  }
};

interface CountryCityPickerProps {
  selectedCountry: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  countryError?: string;
  cityError?: string;
}

export function CountryCityPicker({ 
  selectedCountry, 
  selectedCity, 
  onCountryChange, 
  onCityChange,
  countryError,
  cityError 
}: CountryCityPickerProps) {
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    const countries = Object.keys(COUNTRIES_CITIES);
    if (!searchQuery.trim()) return countries;
    return countries.filter(country => 
      country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filter cities based on search and selected country
  const filteredCities = useMemo(() => {
    if (!selectedCountry || !COUNTRIES_CITIES[selectedCountry]) return [];
    const cities = COUNTRIES_CITIES[selectedCountry].cities;
    if (!searchQuery.trim()) return cities;
    return cities.filter(city => 
      city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedCountry, searchQuery]);

  const handleCountrySelect = (country: string) => {
    onCountryChange(country);
    onCityChange(''); // Reset city when country changes
    setShowCountryModal(false);
    setSearchQuery('');
  };

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setShowCityModal(false);
    setSearchQuery('');
  };

  const openCityModal = () => {
    if (!selectedCountry) {
      Alert.alert('Select Country First', 'Please select a country before choosing a city.');
      return;
    }
    setShowCityModal(true);
  };

  const renderCountryItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.modalItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.modalItemText}>{item}</Text>
      <Text style={styles.modalItemCode}>{COUNTRIES_CITIES[item].code}</Text>
    </TouchableOpacity>
  );

  const renderCityItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.modalItem}
      onPress={() => handleCitySelect(item)}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      {/* Country Picker */}
      <TouchableOpacity 
        style={[styles.picker, countryError && styles.pickerError]}
        onPress={() => setShowCountryModal(true)}
      >
        <Text style={[styles.pickerText, !selectedCountry && styles.placeholder]}>
          {selectedCountry || 'Select Country'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {countryError && <Text style={styles.errorText}>{countryError}</Text>}

      {/* City Picker */}
      <TouchableOpacity 
        style={[styles.picker, cityError && styles.pickerError]}
        onPress={openCityModal}
      >
        <Text style={[styles.pickerText, !selectedCity && styles.placeholder]}>
          {selectedCity || 'Select City'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {cityError && <Text style={styles.errorText}>{cityError}</Text>}

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowCountryModal(false);
                setSearchQuery('');
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Country</Text>
            <View style={styles.placeholder} />
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item}
            style={styles.modalList}
          />
        </View>
      </Modal>

      {/* City Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowCityModal(false);
                setSearchQuery('');
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select City - {selectedCountry}</Text>
            <View style={styles.placeholder} />
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />

          <FlatList
            data={filteredCities}
            renderItem={renderCityItem}
            keyExtractor={(item) => item}
            style={styles.modalList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerError: {
    borderColor: '#FF6B6B',
  },
  pickerText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#999999',
  },
  arrow: {
    color: '#666666',
    fontSize: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#6B8E23',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalItemCode: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});