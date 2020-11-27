/* eslint-disable camelcase */
import { useNavigation, useRoute } from '@react-navigation/native';
import React, {
  useCallback, useEffect, useState, useMemo,
} from 'react';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Alert } from 'react-native';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';

import default_avatar from '../../assets/default_avatar.png';
import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  Content,
  ProvidersListContainer,
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDatePickerButton,
  OpenDatePickerButtonText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
  CreateAppointmentButton,
  CreateAppointmentButtonText,
} from './styles';

interface RouteParams{
  providerId: string
}

export interface Provider{
  id: string;
  name: string;
  avatar_url:string;
}

interface AvailabilityItem{
  hour:number;
  available: boolean;
}

const CreateAppointment: React.FC = () => {
  const route = useRoute();
  const { goBack, navigate } = useNavigation();
  const routeParams = route.params as RouteParams;
  const { user } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(routeParams.providerId);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);

  useEffect(() => {
    api.get('/providers').then((response) => {
      setProviders(response.data);
    });
  }, []);

  useEffect(() => {
    api.get(`/providers/${selectedProvider}/day-availability`, {
      params: {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
      },
    }).then((response) => {
      setAvailability(response.data);
    });
  }, [selectedDate, selectedProvider]);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelecteProvider = useCallback(
    (providerId:string) => {
      setSelectedProvider(providerId);
    },
    [],
  );

  const handleToggleDatePicker = useCallback(
    () => {
      setShowDatePicker((state) => !state);
    },
    [],
  );

  const handleDateChanged = useCallback(
    (event:any, date:Date | undefined) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (date) {
        setSelectedDate(date);
      }
    },
    [],
  );

  const morningAvailability = useMemo(() => availability.filter(({ hour }) => hour < 12)
    .map(({ available, hour }) => ({
      hour,
      available,
      hourFormated: format(new Date().setHours(hour), 'HH:00'),
    })), [availability]);

  const afternoonAvailability = useMemo(() => availability.filter(({ hour }) => hour >= 12)
    .map(({ available, hour }) => ({
      hour,
      available,
      hourFormated: format(new Date().setHours(hour), 'HH:00'),
    })), [availability]);

  const handleSelectHour = useCallback(
    (hour:number) => {
      setSelectedHour(hour);
    },
    [],
  );

  const handleCreateAppointment = useCallback(async () => {
    try {
      const date = new Date(selectedDate);
      date.setHours(selectedHour);
      date.setMinutes(0);

      await api.post('appointments', {
        provider_id: selectedProvider,
        date,
      });
      navigate('AppointmentCreated', { date: date.getTime() });
    } catch (error) {
      Alert.alert(
        'Erro ao criar o agendamento',
        'Ocorreu um erro ao criar o agendamento, tente novamente',
      );
    }
  },
  [navigate, selectedDate, selectedHour, selectedProvider]);

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>
        <HeaderTitle>Cabeleireiros</HeaderTitle>
        <UserAvatar source={user.avatar_url ? { uri: user.avatar_url } : default_avatar} />
      </Header>
      <Content>
        <ProvidersListContainer>
          <ProvidersList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={(provider) => provider.id}
            renderItem={({ item: provider }) => (
              <ProviderContainer
                onPress={() => handleSelecteProvider(provider.id)}
                selected={provider.id === selectedProvider}
              >
                <ProviderAvatar
                  source={provider.avatar_url ? { uri: provider.avatar_url } : default_avatar}
                />
                <ProviderName
                  selected={provider.id === selectedProvider}
                >
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            )}
          />
        </ProvidersListContainer>
        <Calendar>
          <Title>Escolha a Data</Title>
          <OpenDatePickerButton onPress={handleToggleDatePicker}>
            <OpenDatePickerButtonText>Selecionar outra data</OpenDatePickerButtonText>
          </OpenDatePickerButton>
          { showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="calendar"
              onChange={handleDateChanged}
            />
          ) }
        </Calendar>
        <Schedule>
          <Title>Escolha o horário</Title>
          <Section>
            <SectionTitle>Manhã</SectionTitle>
            <SectionContent>
              {morningAvailability.map(({ hourFormated, available, hour }) => (
                <Hour
                  enabled={available}
                  key={hour}
                  available={available}
                  onPress={() => handleSelectHour(hour)}
                  selected={selectedHour === hour}
                >
                  <HourText selected={selectedHour === hour}>
                    {hourFormated}
                  </HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>
          <Section>
            <SectionTitle>Tarde</SectionTitle>
            <SectionContent>
              {afternoonAvailability.map(({ hourFormated, available, hour }) => (
                <Hour
                  enabled={available}
                  key={hour}
                  available={available}
                  onPress={() => handleSelectHour(hour)}
                  selected={selectedHour === hour}
                >
                  <HourText selected={selectedHour === hour}>
                    {hourFormated}
                  </HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>
        </Schedule>
        <CreateAppointmentButton>
          <CreateAppointmentButtonText
            onPress={handleCreateAppointment}
          >
            Agendar
          </CreateAppointmentButtonText>
        </CreateAppointmentButton>
      </Content>
    </Container>
  );
};

export default CreateAppointment;
