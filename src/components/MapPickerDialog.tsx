import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  List, ListItemButton, ListItemText, ListItemIcon,
  Paper, useMediaQuery, useTheme, InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Close, Search, LocationOn, MyLocation } from '@mui/icons-material';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface MapPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: LocationResult) => void;
  initialLocation?: LocationResult | null;
  title?: string;
}

const TURKEY_CENTER = { lat: 39.0, lng: 35.0 };
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 15;

export default function MapPickerDialog({
  open,
  onClose,
  onSelect,
  initialLocation,
  title = 'Konum Sec',
}: MapPickerDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          height: fullScreen ? '100%' : '80vh',
          overflow: 'hidden',
        },
      }}
    >
      {open && (
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <MapPickerDialogContent
            onClose={onClose}
            onSelect={onSelect}
            initialLocation={initialLocation}
            title={title}
          />
        </APIProvider>
      )}
    </Dialog>
  );
}

function MapPickerDialogContent({
  onClose,
  onSelect,
  initialLocation,
  title,
}: Omit<MapPickerDialogProps, 'open'>) {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const map = useMap('location-picker');
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Initialize services
  useEffect(() => {
    if (placesLib && map) {
      autocompleteService.current = new placesLib.AutocompleteService();
      placesService.current = new placesLib.PlacesService(map);
    }
  }, [placesLib, map]);

  useEffect(() => {
    if (geocodingLib) {
      geocoder.current = new geocodingLib.Geocoder();
    }
  }, [geocodingLib]);

  // Reset on mount
  useEffect(() => {
    if (initialLocation && initialLocation.latitude !== 0) {
      setSelectedLocation(initialLocation);
      setSearchText(initialLocation.address);
    } else {
      setSelectedLocation(null);
      setSearchText('');
    }
    setPredictions([]);
  }, [initialLocation]);

  // Center map when location changes
  useEffect(() => {
    if (!map) return;
    if (selectedLocation && selectedLocation.latitude !== 0) {
      map.panTo({ lat: selectedLocation.latitude, lng: selectedLocation.longitude });
      map.setZoom(SELECTED_ZOOM);
    } else {
      map.panTo(TURKEY_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    }
  }, [map, selectedLocation]);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      if (!autocompleteService.current) {
        setIsSearching(false);
        return;
      }
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'tr' },
        },
        (
          results: google.maps.places.AutocompletePrediction[] | null,
          status: google.maps.places.PlacesServiceStatus,
        ) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300);
  }, []);

  const handleSelectPrediction = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry', 'formatted_address'] },
      (
        place: google.maps.places.PlaceResult | null,
        status: google.maps.places.PlacesServiceStatus,
      ) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = parseFloat(place.geometry.location.lat().toFixed(4));
          const lng = parseFloat(place.geometry.location.lng().toFixed(4));
          const address = place.formatted_address || prediction.description;
          setSelectedLocation({ address, latitude: lat, longitude: lng });
          setSearchText(address);
          setPredictions([]);
        }
      }
    );
  }, []);

  // Map onClick event from @vis.gl/react-google-maps gives { detail: { latLng: LatLngLiteral } }
  const handleMapClick = useCallback((event: { detail: { latLng: google.maps.LatLngLiteral | null } }) => {
    const latLng = event.detail.latLng;
    if (!latLng) return;

    const lat = parseFloat(latLng.lat.toFixed(4));
    const lng = parseFloat(latLng.lng.toFixed(4));

    if (geocoder.current) {
      geocoder.current.geocode(
        { location: { lat, lng } },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus,
        ) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const address = results[0].formatted_address;
            setSelectedLocation({ address, latitude: lat, longitude: lng });
            setSearchText(address);
          } else {
            setSelectedLocation({
              address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              latitude: lat,
              longitude: lng,
            });
            setSearchText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
          setPredictions([]);
        }
      );
    } else {
      setSelectedLocation({
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      });
      setSearchText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setPredictions([]);
    }
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
      onClose();
    }
  };

  return (
    <>
      {/* Title */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          py: 1.5,
          px: 2.5,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', position: 'relative', zIndex: 2 }}>
          <TextField
            fullWidth
            placeholder="Adres veya konum ara..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: isSearching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Autocomplete Results */}
          {predictions.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                left: 16,
                right: 16,
                top: '100%',
                zIndex: 10,
                maxHeight: 250,
                overflow: 'auto',
                borderRadius: 2,
                mt: 0.5,
              }}
            >
              <List dense disablePadding>
                {predictions.map((prediction) => (
                  <ListItemButton
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    sx={{
                      py: 1,
                      '&:hover': { bgcolor: '#f0f9ff' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <LocationOn sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={prediction.structured_formatting.main_text}
                      secondary={prediction.structured_formatting.secondary_text}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}
                      secondaryTypographyProps={{ fontSize: 12, color: '#64748b' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1, minHeight: 300, position: 'relative' }}>
          <Map
            id="location-picker"
            defaultCenter={TURKEY_CENTER}
            defaultZoom={DEFAULT_ZOOM}
            onClick={handleMapClick}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="location-picker-map"
            style={{ width: '100%', height: '100%' }}
          >
            {selectedLocation && (
              <AdvancedMarker
                position={{
                  lat: selectedLocation.latitude,
                  lng: selectedLocation.longitude,
                }}
              >
                <Pin background="#0ea5e9" borderColor="#0284c7" glyphColor="#ffffff" />
              </AdvancedMarker>
            )}
          </Map>

          {/* Konum bilgilendirme - haritanin ustunde */}
          {!selectedLocation && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(15, 23, 42, 0.85)',
                color: 'white',
                px: 2.5,
                py: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pointerEvents: 'none',
              }}
            >
              <MyLocation sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 13 }}>
                Arama yapin veya haritaya tiklayin
              </Typography>
            </Box>
          )}
        </Box>

        {/* Selected Location Info */}
        {selectedLocation && (
          <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <LocationOn sx={{ color: '#0ea5e9', fontSize: 18 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>
                {selectedLocation.address}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: '#64748b', pl: 3.5 }}>
              Enlem: {selectedLocation.latitude.toFixed(4)} | Boylam: {selectedLocation.longitude.toFixed(4)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ borderTop: '1px solid #e2e8f0', px: 2.5, py: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#e2e8f0',
            color: '#64748b',
            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
          }}
        >
          Iptal
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedLocation}
          sx={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            },
          }}
        >
          Sec
        </Button>
      </DialogActions>
    </>
  );
}
