import { type FetchResponse, openmrsFetch, restBaseUrl, useDebounce } from '@openmrs/esm-framework';
import useSWR from 'swr';

export interface PatientSearchResult {
  uuid: string;
  display?: string;
  identifiers?: Array<{
    identifier?: string;
    preferred?: boolean;
  }>;
  patientIdentifier?: {
    identifier?: string;
  };
  person?: {
    personName?: {
      display?: string;
      givenName?: string;
      middleName?: string;
      familyName?: string;
    };
  };
}

export interface PatientSearchOption {
  uuid: string;
  label: string;
  name: string;
  identifier: string;
}

const patientSearchRepresentation = encodeURIComponent(
  'custom:(uuid,display,identifiers:(identifier,preferred),patientIdentifier:(identifier),person:(personName))',
);

const buildPatientSearchUrl = (query: string) =>
  `${restBaseUrl}/patient?q=${encodeURIComponent(query)}&v=${patientSearchRepresentation}&limit=10&totalCount=false`;

export const extractPatientName = (patient: PatientSearchResult) => {
  const personName = patient.person?.personName;
  if (personName?.display) {
    return personName.display;
  }

  if (personName) {
    return [personName.givenName, personName.middleName, personName.familyName].filter(Boolean).join(' ');
  }

  const [, displayName = patient.display ?? patient.uuid] = patient.display?.split(' - ') ?? [];
  return displayName;
};

export const extractPatientIdentifier = (patient: PatientSearchResult) =>
  patient.patientIdentifier?.identifier ||
  patient.identifiers?.find((identifier) => identifier.preferred)?.identifier ||
  patient.identifiers?.[0]?.identifier ||
  patient.display?.split(' - ')[0]?.trim() ||
  '';

export const formatPatientLabel = (patientName: string, patientIdentifier: string) =>
  patientIdentifier ? `${patientName} (${patientIdentifier})` : patientName;

export const toPatientSearchOption = (patient: PatientSearchResult): PatientSearchOption => {
  const name = extractPatientName(patient);
  const identifier = extractPatientIdentifier(patient);

  return {
    uuid: patient.uuid,
    name,
    identifier,
    label: formatPatientLabel(name, identifier),
  };
};

export const usePatientSearchResults = (searchTerm: string, selectedPatientLabel?: string, minimumLength = 2) => {
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  const normalizedSelectedLabel = selectedPatientLabel?.trim() ?? '';
  const showResults =
    debouncedSearchTerm.length >= minimumLength &&
    (!normalizedSelectedLabel || debouncedSearchTerm !== normalizedSelectedLabel);

  const { data, error, isLoading } = useSWR<FetchResponse<{ results: Array<PatientSearchResult> }>, Error>(
    showResults ? buildPatientSearchUrl(debouncedSearchTerm) : null,
    openmrsFetch,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    showResults,
    results: data?.data?.results ?? [],
    error,
    isLoading,
  };
};
