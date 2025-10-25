import { Input } from '@/componentes/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Label } from '@/componentes/ui/label';
import ReactCountryFlag from 'react-country-flag';

interface CodigoPais {
  codigo: string;
  nombre: string;
  bandera: string;
  iso: string;
}

const codigos_paises: CodigoPais[] = [
  { codigo: '+93', nombre: 'Afganistán', bandera: '🇦🇫', iso: 'AF' },
  { codigo: '+355', nombre: 'Albania', bandera: '🇦🇱', iso: 'AL' },
  { codigo: '+49', nombre: 'Alemania', bandera: '🇩🇪', iso: 'DE' },
  { codigo: '+376', nombre: 'Andorra', bandera: '🇦🇩', iso: 'AD' },
  { codigo: '+244', nombre: 'Angola', bandera: '🇦🇴', iso: 'AO' },
  { codigo: '+1264', nombre: 'Anguila', bandera: '🇦🇮', iso: 'AI' },
  { codigo: '+672', nombre: 'Antártida', bandera: '🇦🇶', iso: 'AQ' },
  { codigo: '+1268', nombre: 'Antigua y Barbuda', bandera: '🇦🇬', iso: 'AG' },
  { codigo: '+966', nombre: 'Arabia Saudita', bandera: '🇸🇦', iso: 'SA' },
  { codigo: '+213', nombre: 'Argelia', bandera: '🇩🇿', iso: 'DZ' },
  { codigo: '+54', nombre: 'Argentina', bandera: '🇦🇷', iso: 'AR' },
  { codigo: '+374', nombre: 'Armenia', bandera: '🇦🇲', iso: 'AM' },
  { codigo: '+297', nombre: 'Aruba', bandera: '🇦🇼', iso: 'AW' },
  { codigo: '+61', nombre: 'Australia', bandera: '🇦🇺', iso: 'AU' },
  { codigo: '+43', nombre: 'Austria', bandera: '🇦🇹', iso: 'AT' },
  { codigo: '+994', nombre: 'Azerbaiyán', bandera: '🇦🇿', iso: 'AZ' },
  { codigo: '+1242', nombre: 'Bahamas', bandera: '🇧🇸', iso: 'BS' },
  { codigo: '+973', nombre: 'Baréin', bandera: '🇧🇭', iso: 'BH' },
  { codigo: '+880', nombre: 'Bangladés', bandera: '🇧🇩', iso: 'BD' },
  { codigo: '+1246', nombre: 'Barbados', bandera: '🇧🇧', iso: 'BB' },
  { codigo: '+32', nombre: 'Bélgica', bandera: '🇧🇪', iso: 'BE' },
  { codigo: '+501', nombre: 'Belice', bandera: '🇧🇿', iso: 'BZ' },
  { codigo: '+229', nombre: 'Benín', bandera: '🇧🇯', iso: 'BJ' },
  { codigo: '+1441', nombre: 'Bermudas', bandera: '🇧🇲', iso: 'BM' },
  { codigo: '+375', nombre: 'Bielorrusia', bandera: '🇧🇾', iso: 'BY' },
  { codigo: '+591', nombre: 'Bolivia', bandera: '🇧🇴', iso: 'BO' },
  { codigo: '+387', nombre: 'Bosnia y Herzegovina', bandera: '🇧🇦', iso: 'BA' },
  { codigo: '+267', nombre: 'Botsuana', bandera: '🇧🇼', iso: 'BW' },
  { codigo: '+55', nombre: 'Brasil', bandera: '🇧🇷', iso: 'BR' },
  { codigo: '+673', nombre: 'Brunéi', bandera: '🇧🇳', iso: 'BN' },
  { codigo: '+359', nombre: 'Bulgaria', bandera: '🇧🇬', iso: 'BG' },
  { codigo: '+226', nombre: 'Burkina Faso', bandera: '🇧🇫', iso: 'BF' },
  { codigo: '+257', nombre: 'Burundi', bandera: '🇧🇮', iso: 'BI' },
  { codigo: '+975', nombre: 'Bután', bandera: '🇧🇹', iso: 'BT' },
  { codigo: '+238', nombre: 'Cabo Verde', bandera: '🇨🇻', iso: 'CV' },
  { codigo: '+855', nombre: 'Camboya', bandera: '🇰🇭', iso: 'KH' },
  { codigo: '+237', nombre: 'Camerún', bandera: '🇨🇲', iso: 'CM' },
  { codigo: '+235', nombre: 'Chad', bandera: '🇹🇩', iso: 'TD' },
  { codigo: '+56', nombre: 'Chile', bandera: '🇨🇱', iso: 'CL' },
  { codigo: '+86', nombre: 'China', bandera: '🇨🇳', iso: 'CN' },
  { codigo: '+357', nombre: 'Chipre', bandera: '🇨🇾', iso: 'CY' },
  { codigo: '+57', nombre: 'Colombia', bandera: '🇨🇴', iso: 'CO' },
  { codigo: '+269', nombre: 'Comoras', bandera: '🇰🇲', iso: 'KM' },
  { codigo: '+850', nombre: 'Corea del Norte', bandera: '🇰🇵', iso: 'KP' },
  { codigo: '+82', nombre: 'Corea del Sur', bandera: '🇰🇷', iso: 'KR' },
  { codigo: '+225', nombre: 'Costa de Marfil', bandera: '🇨🇮', iso: 'CI' },
  { codigo: '+506', nombre: 'Costa Rica', bandera: '🇨🇷', iso: 'CR' },
  { codigo: '+385', nombre: 'Croacia', bandera: '🇭🇷', iso: 'HR' },
  { codigo: '+53', nombre: 'Cuba', bandera: '🇨🇺', iso: 'CU' },
  { codigo: '+599', nombre: 'Curazao', bandera: '🇨🇼', iso: 'CW' },
  { codigo: '+45', nombre: 'Dinamarca', bandera: '🇩🇰', iso: 'DK' },
  { codigo: '+1767', nombre: 'Dominica', bandera: '🇩🇲', iso: 'DM' },
  { codigo: '+593', nombre: 'Ecuador', bandera: '🇪🇨', iso: 'EC' },
  { codigo: '+20', nombre: 'Egipto', bandera: '🇪🇬', iso: 'EG' },
  { codigo: '+503', nombre: 'El Salvador', bandera: '🇸🇻', iso: 'SV' },
  { codigo: '+971', nombre: 'Emiratos Árabes Unidos', bandera: '🇦🇪', iso: 'AE' },
  { codigo: '+291', nombre: 'Eritrea', bandera: '🇪🇷', iso: 'ER' },
  { codigo: '+421', nombre: 'Eslovaquia', bandera: '🇸🇰', iso: 'SK' },
  { codigo: '+386', nombre: 'Eslovenia', bandera: '🇸🇮', iso: 'SI' },
  { codigo: '+34', nombre: 'España', bandera: '🇪🇸', iso: 'ES' },
  { codigo: '+1', nombre: 'EE.UU./Canadá y otros', bandera: '🇺🇸', iso: 'US' },
  { codigo: '+372', nombre: 'Estonia', bandera: '🇪🇪', iso: 'EE' },
  { codigo: '+268', nombre: 'Esuatini', bandera: '🇸🇿', iso: 'SZ' },
  { codigo: '+251', nombre: 'Etiopía', bandera: '🇪🇹', iso: 'ET' },
  { codigo: '+63', nombre: 'Filipinas', bandera: '🇵🇭', iso: 'PH' },
  { codigo: '+358', nombre: 'Finlandia', bandera: '🇫🇮', iso: 'FI' },
  { codigo: '+679', nombre: 'Fiyi', bandera: '🇫🇯', iso: 'FJ' },
  { codigo: '+33', nombre: 'Francia', bandera: '🇫🇷', iso: 'FR' },
  { codigo: '+241', nombre: 'Gabón', bandera: '🇬🇦', iso: 'GA' },
  { codigo: '+220', nombre: 'Gambia', bandera: '🇬🇲', iso: 'GM' },
  { codigo: '+995', nombre: 'Georgia', bandera: '🇬🇪', iso: 'GE' },
  { codigo: '+233', nombre: 'Ghana', bandera: '🇬🇭', iso: 'GH' },
  { codigo: '+350', nombre: 'Gibraltar', bandera: '🇬🇮', iso: 'GI' },
  { codigo: '+1473', nombre: 'Granada', bandera: '🇬🇩', iso: 'GD' },
  { codigo: '+30', nombre: 'Grecia', bandera: '🇬🇷', iso: 'GR' },
  { codigo: '+299', nombre: 'Groenlandia', bandera: '🇬🇱', iso: 'GL' },
  { codigo: '+590', nombre: 'Guadalupe', bandera: '🇬🇵', iso: 'GP' },
  { codigo: '+1671', nombre: 'Guam', bandera: '🇬🇺', iso: 'GU' },
  { codigo: '+502', nombre: 'Guatemala', bandera: '🇬🇹', iso: 'GT' },
  { codigo: '+594', nombre: 'Guayana Francesa', bandera: '🇬🇫', iso: 'GF' },
  { codigo: '+44', nombre: 'Guernsey/R. Unido', bandera: '🇬🇬', iso: 'GG' },
  { codigo: '+224', nombre: 'Guinea', bandera: '🇬🇳', iso: 'GN' },
  { codigo: '+240', nombre: 'Guinea Ecuatorial', bandera: '🇬🇶', iso: 'GQ' },
  { codigo: '+245', nombre: 'Guinea-Bisáu', bandera: '🇬🇼', iso: 'GW' },
  { codigo: '+592', nombre: 'Guyana', bandera: '🇬🇾', iso: 'GY' },
  { codigo: '+509', nombre: 'Haití', bandera: '🇭🇹', iso: 'HT' },
  { codigo: '+504', nombre: 'Honduras', bandera: '🇭🇳', iso: 'HN' },
  { codigo: '+852', nombre: 'Hong Kong', bandera: '🇭🇰', iso: 'HK' },
  { codigo: '+36', nombre: 'Hungría', bandera: '🇭🇺', iso: 'HU' },
  { codigo: '+91', nombre: 'India', bandera: '🇮🇳', iso: 'IN' },
  { codigo: '+62', nombre: 'Indonesia', bandera: '🇮🇩', iso: 'ID' },
  { codigo: '+964', nombre: 'Irak', bandera: '🇮🇶', iso: 'IQ' },
  { codigo: '+98', nombre: 'Irán', bandera: '🇮🇷', iso: 'IR' },
  { codigo: '+353', nombre: 'Irlanda', bandera: '🇮🇪', iso: 'IE' },
  { codigo: '+246', nombre: 'Isla B. O. Índico', bandera: '🇮🇴', iso: 'IO' },
  { codigo: '+61891', nombre: 'Isla de Cocos', bandera: '🇨🇨', iso: 'CC' },
  { codigo: '+441624', nombre: 'Isla de Man', bandera: '🇮🇲', iso: 'IM' },
  { codigo: '+61891', nombre: 'Isla de Navidad', bandera: '🇨🇽', iso: 'CX' },
  { codigo: '+47', nombre: 'Isla Bouvet/Noruega', bandera: '🇧🇻', iso: 'BV' },
  { codigo: '+500', nombre: 'Islas F. (Malvinas)', bandera: '🇫🇰', iso: 'FK' },
  { codigo: '+298', nombre: 'Islas Feroe', bandera: '🇫🇴', iso: 'FO' },
  { codigo: '+672', nombre: 'Islas Heard y McDonald', bandera: '🇭🇲', iso: 'HM' },
  { codigo: '+1345', nombre: 'Islas Caimán', bandera: '🇰🇾', iso: 'KY' },
  { codigo: '+682', nombre: 'Islas Cook', bandera: '🇨🇰', iso: 'CK' },
  { codigo: '+670', nombre: 'Islas M. del Norte', bandera: '🇲🇵', iso: 'MP' },
  { codigo: '+692', nombre: 'Islas Marshall', bandera: '🇲🇭', iso: 'MH' },
  { codigo: '+677', nombre: 'Islas Salomón', bandera: '🇸🇧', iso: 'SB' },
  { codigo: '+1649', nombre: 'Islas Turcas y Caicos', bandera: '🇹🇨', iso: 'TC' },
  { codigo: '+1284', nombre: 'Islas Vírgenes (UK)', bandera: '🇻🇬', iso: 'VG' },
  { codigo: '+1340', nombre: 'Islas Vírgenes (US)', bandera: '🇻🇮', iso: 'VI' },
  { codigo: '+354', nombre: 'Islandia', bandera: '🇮🇸', iso: 'IS' },
  { codigo: '+972', nombre: 'Israel', bandera: '🇮🇱', iso: 'IL' },
  { codigo: '+39', nombre: 'Italia', bandera: '🇮🇹', iso: 'IT' },
  { codigo: '+1876', nombre: 'Jamaica', bandera: '🇯🇲', iso: 'JM' },
  { codigo: '+81', nombre: 'Japón', bandera: '🇯🇵', iso: 'JP' },
  { codigo: '+441534', nombre: 'Jersey', bandera: '🇯🇪', iso: 'JE' },
  { codigo: '+962', nombre: 'Jordania', bandera: '🇯🇴', iso: 'JO' },
  { codigo: '+7', nombre: 'Kazajistán/Rusia', bandera: '🇰🇿', iso: 'KZ' },
  { codigo: '+254', nombre: 'Kenia', bandera: '🇰🇪', iso: 'KE' },
  { codigo: '+996', nombre: 'Kirguistán', bandera: '🇰🇬', iso: 'KG' },
  { codigo: '+686', nombre: 'Kiribati', bandera: '🇰🇮', iso: 'KI' },
  { codigo: '+965', nombre: 'Kuwait', bandera: '🇰🇼', iso: 'KW' },
  { codigo: '+856', nombre: 'Laos', bandera: '🇱🇦', iso: 'LA' },
  { codigo: '+266', nombre: 'Lesoto', bandera: '🇱🇸', iso: 'LS' },
  { codigo: '+371', nombre: 'Letonia', bandera: '🇱🇻', iso: 'LV' },
  { codigo: '+961', nombre: 'Líbano', bandera: '🇱🇧', iso: 'LB' },
  { codigo: '+231', nombre: 'Liberia', bandera: '🇱🇷', iso: 'LR' },
  { codigo: '+218', nombre: 'Libia', bandera: '🇱🇾', iso: 'LY' },
  { codigo: '+423', nombre: 'Liechtenstein', bandera: '🇱🇮', iso: 'LI' },
  { codigo: '+370', nombre: 'Lituania', bandera: '🇱🇹', iso: 'LT' },
  { codigo: '+352', nombre: 'Luxemburgo', bandera: '🇱🇺', iso: 'LU' },
  { codigo: '+853', nombre: 'Macao', bandera: '🇲🇴', iso: 'MO' },
  { codigo: '+389', nombre: 'Macedonia del Norte', bandera: '🇲🇰', iso: 'MK' },
  { codigo: '+261', nombre: 'Madagascar', bandera: '🇲🇬', iso: 'MG' },
  { codigo: '+60', nombre: 'Malasia', bandera: '🇲🇾', iso: 'MY' },
  { codigo: '+265', nombre: 'Malaui', bandera: '🇲🇼', iso: 'MW' },
  { codigo: '+960', nombre: 'Maldivas', bandera: '🇲🇻', iso: 'MV' },
  { codigo: '+223', nombre: 'Malí', bandera: '🇲🇱', iso: 'ML' },
  { codigo: '+356', nombre: 'Malta', bandera: '🇲🇹', iso: 'MT' },
  { codigo: '+212', nombre: 'Marruecos', bandera: '🇲🇦', iso: 'MA' },
  { codigo: '+596', nombre: 'Martinica', bandera: '🇲🇶', iso: 'MQ' },
  { codigo: '+230', nombre: 'Mauricio', bandera: '🇲🇺', iso: 'MU' },
  { codigo: '+222', nombre: 'Mauritania', bandera: '🇲🇷', iso: 'MR' },
  { codigo: '+262', nombre: 'Mayotte/Reunión', bandera: '🇾🇹', iso: 'YT' },
  { codigo: '+52', nombre: 'México', bandera: '🇲🇽', iso: 'MX' },
  { codigo: '+691', nombre: 'Micronesia', bandera: '🇫🇲', iso: 'FM' },
  { codigo: '+373', nombre: 'Moldavia', bandera: '🇲🇩', iso: 'MD' },
  { codigo: '+377', nombre: 'Mónaco', bandera: '🇲🇨', iso: 'MC' },
  { codigo: '+976', nombre: 'Mongolia', bandera: '🇲🇳', iso: 'MN' },
  { codigo: '+382', nombre: 'Montenegro', bandera: '🇲🇪', iso: 'ME' },
  { codigo: '+1664', nombre: 'Montserrat', bandera: '🇲🇸', iso: 'MS' },
  { codigo: '+258', nombre: 'Mozambique', bandera: '🇲🇿', iso: 'MZ' },
  { codigo: '+95', nombre: 'Myanmar (Birmania)', bandera: '🇲🇲', iso: 'MM' },
  { codigo: '+264', nombre: 'Namibia', bandera: '🇳🇦', iso: 'NA' },
  { codigo: '+674', nombre: 'Nauru', bandera: '🇳🇷', iso: 'NR' },
  { codigo: '+977', nombre: 'Nepal', bandera: '🇳🇵', iso: 'NP' },
  { codigo: '+505', nombre: 'Nicaragua', bandera: '🇳🇮', iso: 'NI' },
  { codigo: '+227', nombre: 'Níger', bandera: '🇳🇪', iso: 'NE' },
  { codigo: '+234', nombre: 'Nigeria', bandera: '🇳🇬', iso: 'NG' },
  { codigo: '+683', nombre: 'Niue', bandera: '🇳🇺', iso: 'NU' },
  { codigo: '+672', nombre: 'Isla Norfolk', bandera: '🇳🇫', iso: 'NF' },
  { codigo: '+47', nombre: 'Noruega', bandera: '🇳🇴', iso: 'NO' },
  { codigo: '+687', nombre: 'Nueva Caledonia', bandera: '🇳🇨', iso: 'NC' },
  { codigo: '+64', nombre: 'Nueva Zelanda', bandera: '🇳🇿', iso: 'NZ' },
  { codigo: '+968', nombre: 'Omán', bandera: '🇴🇲', iso: 'OM' },
  { codigo: '+31', nombre: 'Países Bajos', bandera: '🇳🇱', iso: 'NL' },
  { codigo: '+92', nombre: 'Pakistán', bandera: '🇵🇰', iso: 'PK' },
  { codigo: '+680', nombre: 'Palaos', bandera: '🇵🇼', iso: 'PW' },
  { codigo: '+970', nombre: 'Palestina', bandera: '🇵🇸', iso: 'PS' },
  { codigo: '+507', nombre: 'Panamá', bandera: '🇵🇦', iso: 'PA' },
  { codigo: '+675', nombre: 'Papúa N. Guinea', bandera: '🇵🇬', iso: 'PG' },
  { codigo: '+595', nombre: 'Paraguay', bandera: '🇵🇾', iso: 'PY' },
  { codigo: '+51', nombre: 'Perú', bandera: '🇵🇪', iso: 'PE' },
  { codigo: '+689', nombre: 'Polinesia Francesa', bandera: '🇵🇫', iso: 'PF' },
  { codigo: '+48', nombre: 'Polonia', bandera: '🇵🇱', iso: 'PL' },
  { codigo: '+351', nombre: 'Portugal', bandera: '🇵🇹', iso: 'PT' },
  { codigo: '+1787', nombre: 'Puerto Rico', bandera: '🇵🇷', iso: 'PR' },
  { codigo: '+974', nombre: 'Qatar', bandera: '🇶🇦', iso: 'QA' },
  { codigo: '+236', nombre: 'Rep. Centroafricana', bandera: '🇨🇫', iso: 'CF' },
  { codigo: '+420', nombre: 'Rep. Checa', bandera: '🇨🇿', iso: 'CZ' },
  { codigo: '+243', nombre: 'Rep. Dem. del Congo', bandera: '🇨🇩', iso: 'CD' },
  { codigo: '+242', nombre: 'Rep. del Congo', bandera: '🇨🇬', iso: 'CG' },
  { codigo: '+1809', nombre: 'Rep. Dominicana', bandera: '🇩🇴', iso: 'DO' },
  { codigo: '+262', nombre: 'Reunión/Mayotte', bandera: '🇷🇪', iso: 'RE' },
  { codigo: '+250', nombre: 'Ruanda', bandera: '🇷🇼', iso: 'RW' },
  { codigo: '+40', nombre: 'Rumania', bandera: '🇷🇴', iso: 'RO' },
  { codigo: '+212', nombre: 'Sahara Occidental', bandera: '🇪🇭', iso: 'EH' },
  { codigo: '+685', nombre: 'Samoa', bandera: '🇼🇸', iso: 'WS' },
  { codigo: '+1684', nombre: 'Samoa Americana', bandera: '🇦🇸', iso: 'AS' },
  { codigo: '+1869', nombre: 'San Cristóbal y Nieves', bandera: '🇰🇳', iso: 'KN' },
  { codigo: '+378', nombre: 'San Marino', bandera: '🇸🇲', iso: 'SM' },
  { codigo: '+508', nombre: 'San Pedro y Miquelón', bandera: '🇵🇲', iso: 'PM' },
  { codigo: '+1784', nombre: 'San Vicente y Granadinas', bandera: '🇻🇨', iso: 'VC' },
  { codigo: '+290', nombre: 'Santa Elena', bandera: '🇸🇭', iso: 'SH' },
  { codigo: '+1758', nombre: 'Santa Lucía', bandera: '🇱🇨', iso: 'LC' },
  { codigo: '+239', nombre: 'Santo Tomé y Príncipe', bandera: '🇸🇹', iso: 'ST' },
  { codigo: '+221', nombre: 'Senegal', bandera: '🇸🇳', iso: 'SN' },
  { codigo: '+381', nombre: 'Serbia', bandera: '🇷🇸', iso: 'RS' },
  { codigo: '+248', nombre: 'Seychelles', bandera: '🇸🇨', iso: 'SC' },
  { codigo: '+232', nombre: 'Sierra Leona', bandera: '🇸🇱', iso: 'SL' },
  { codigo: '+65', nombre: 'Singapur', bandera: '🇸🇬', iso: 'SG' },
  { codigo: '+1721', nombre: 'Sint Maarten', bandera: '🇸🇽', iso: 'SX' },
  { codigo: '+963', nombre: 'Siria', bandera: '🇸🇾', iso: 'SY' },
  { codigo: '+252', nombre: 'Somalia', bandera: '🇸🇴', iso: 'SO' },
  { codigo: '+94', nombre: 'Sri Lanka', bandera: '🇱🇰', iso: 'LK' },
  { codigo: '+27', nombre: 'Sudáfrica', bandera: '🇿🇦', iso: 'ZA' },
  { codigo: '+211', nombre: 'Sudán del Sur', bandera: '🇸🇸', iso: 'SS' },
  { codigo: '+249', nombre: 'Sudán', bandera: '🇸🇩', iso: 'SD' },
  { codigo: '+46', nombre: 'Suecia', bandera: '🇸🇪', iso: 'SE' },
  { codigo: '+41', nombre: 'Suiza', bandera: '🇨🇭', iso: 'CH' },
  { codigo: '+597', nombre: 'Surinam', bandera: '🇸🇷', iso: 'SR' },
  { codigo: '+47', nombre: 'Svalbard y Jan Mayen', bandera: '🇸🇯', iso: 'SJ' },
  { codigo: '+66', nombre: 'Tailandia', bandera: '🇹🇭', iso: 'TH' },
  { codigo: '+886', nombre: 'Taiwán', bandera: '🇹🇼', iso: 'TW' },
  { codigo: '+255', nombre: 'Tanzania', bandera: '🇹🇿', iso: 'TZ' },
  { codigo: '+992', nombre: 'Tayikistán', bandera: '🇹🇯', iso: 'TJ' },
  { codigo: '+670', nombre: 'Timor Oriental', bandera: '🇹🇱', iso: 'TL' },
  { codigo: '+228', nombre: 'Togo', bandera: '🇹🇬', iso: 'TG' },
  { codigo: '+690', nombre: 'Tokelau', bandera: '🇹🇰', iso: 'TK' },
  { codigo: '+676', nombre: 'Tonga', bandera: '🇹🇴', iso: 'TO' },
  { codigo: '+1868', nombre: 'Trinidad y Tobago', bandera: '🇹🇹', iso: 'TT' },
  { codigo: '+216', nombre: 'Túnez', bandera: '🇹🇳', iso: 'TN' },
  { codigo: '+993', nombre: 'Turkmenistán', bandera: '🇹🇲', iso: 'TM' },
  { codigo: '+90', nombre: 'Turquía', bandera: '🇹🇷', iso: 'TR' },
  { codigo: '+688', nombre: 'Tuvalu', bandera: '🇹🇻', iso: 'TV' },
  { codigo: '+380', nombre: 'Ucrania', bandera: '🇺🇦', iso: 'UA' },
  { codigo: '+256', nombre: 'Uganda', bandera: '🇺🇬', iso: 'UG' },
  { codigo: '+598', nombre: 'Uruguay', bandera: '🇺🇾', iso: 'UY' },
  { codigo: '+998', nombre: 'Uzbekistán', bandera: '🇺🇿', iso: 'UZ' },
  { codigo: '+678', nombre: 'Vanuatu', bandera: '🇻🇺', iso: 'VU' },
  { codigo: '+379', nombre: 'Vaticano', bandera: '🇻🇦', iso: 'VA' },
  { codigo: '+58', nombre: 'Venezuela', bandera: '🇻🇪', iso: 'VE' },
  { codigo: '+84', nombre: 'Vietnam', bandera: '🇻🇳', iso: 'VN' },
  { codigo: '+681', nombre: 'Wallis y Futuna', bandera: '🇼🇫', iso: 'WF' },
  { codigo: '+967', nombre: 'Yemen', bandera: '🇾🇪', iso: 'YE' },
  { codigo: '+253', nombre: 'Yibuti', bandera: '🇩🇯', iso: 'DJ' },
  { codigo: '+260', nombre: 'Zambia', bandera: '🇿🇲', iso: 'ZM' },
  { codigo: '+263', nombre: 'Zimbabue', bandera: '🇿🇼', iso: 'ZW' },
];

interface PhoneInputProps {
  codigo_pais: string;
  numero: string;
  onCodigoPaisChange: (codigo: string) => void;
  onNumeroChange: (numero: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function PhoneInput({
  codigo_pais,
  numero,
  onCodigoPaisChange,
  onNumeroChange,
  disabled = false,
  label = 'Teléfono',
  placeholder = '70123456',
}: PhoneInputProps) {
  const pais_seleccionado = codigos_paises.find(p => p.codigo === codigo_pais);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Select value={codigo_pais} onValueChange={onCodigoPaisChange} disabled={disabled}>
          <SelectTrigger className="w-[180px] hover:border-primary/50 focus:border-primary transition-all duration-200">
            <SelectValue>
              {pais_seleccionado && (
                <div className="flex items-center gap-2">
                  <ReactCountryFlag
                    countryCode={pais_seleccionado.iso}
                    svg
                    style={{ width: '1.5em', height: '1.5em' }} 
                    title={pais_seleccionado.nombre} 
                  />
                  <span>{pais_seleccionado.codigo}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {codigos_paises.map((pais) => (
              <SelectItem key={pais.codigo} value={pais.codigo}>
                <div className="flex items-center gap-2">
                  <ReactCountryFlag
                    countryCode={pais.iso}
                    svg
                    style={{ width: '1.5em', height: '1.5em' }}
                    title={pais.nombre}
                  />
                  <span className="font-medium">{pais.codigo}</span>
                  <span className="text-muted-foreground text-sm">{pais.nombre}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={numero}
          onChange={(e) => {
            const valor = e.target.value.replace(/[^\d]/g, '');
            onNumeroChange(valor);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 hover:border-primary/50 focus:border-primary transition-all duration-200"
          maxLength={15}
        />
      </div>
    </div>
  );
}

export function formatearTelefonoCompleto(codigo_pais: string, numero: string): string {
  return `${codigo_pais}${numero}`;
}

export function separarTelefono(telefono_completo: string): { codigo_pais: string; numero: string } {
  if (!telefono_completo) {
    return { codigo_pais: '+591', numero: '' };
  }

  const pais_encontrado = codigos_paises.find(p => telefono_completo.startsWith(p.codigo));
  
  if (pais_encontrado) {
    return {
      codigo_pais: pais_encontrado.codigo,
      numero: telefono_completo.substring(pais_encontrado.codigo.length),
    };
  }

  return { codigo_pais: '+591', numero: telefono_completo };
}