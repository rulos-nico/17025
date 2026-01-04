"""
Preprocesador de texto con extracción y evaluación de números
Preserva valores numéricos reales para análisis
"""

import re
from typing import Dict, List, Tuple, Optional, Any
import numpy as np


class TextPreprocessor:
    """Preprocesador avanzado con evaluación de números"""
    
    def __init__(self):
        # Patrones de extracción con grupos de captura
        self.patterns = {
            'codigo_documento': r'\b([A-Z]{2,4}-\d{4}-\d{3,4})\b',
            'fecha_ddmmyyyy': r'\b(\d{2})/(\d{2})/(\d{4})\b',
            'fecha_yyyymmdd': r'\b(\d{4})-(\d{2})-(\d{2})\b',
            'norma_iso': r'\b(ISO\s+(\d+)[-\d]*)\b',
            'temperatura': r'\b(\d+\.?\d*)\s*°C\b',
            'presion': r'\b(\d+\.?\d*)\s*(?:MPa|Pa|kPa)\b',
            'longitud': r'\b(\d+\.?\d*)\s*(?:mm|cm|m)\b',
            'masa': r'\b(\d+\.?\d*)\s*(?:g|kg|ton)\b',
            'fuerza': r'\b(\d+\.?\d*)\s*(?:N|kN)\b',
            'porcentaje': r'\b(\d+\.?\d*)\s*%\b',
            'numero_general': r'\b(\d+\.?\d*)\b'
        }
        
        # Tokens de reemplazo
        self.replacement_tokens = {
            'codigo_documento': '<CODIGO_DOC>',
            'fecha_ddmmyyyy': '<FECHA>',
            'fecha_yyyymmdd': '<FECHA>',
            'norma_iso': '<NORMA_ISO>',
            'temperatura': '<TEMP>',
            'presion': '<PRESION>',
            'longitud': '<LONGITUD>',
            'masa': '<MASA>',
            'fuerza': '<FUERZA>',
            'porcentaje': '<PORCENTAJE>',
            'numero_general': '<NUM>'
        }
        
        # Rangos esperados para validación
        self.expected_ranges = {
            'temperatura': {'min': -273.15, 'max': 1500, 'unit': '°C'},
            'presion': {'min': 0, 'max': 10000, 'unit': 'MPa'},
            'longitud': {'min': 0, 'max': 100000, 'unit': 'mm'},
            'masa': {'min': 0, 'max': 100000, 'unit': 'kg'},
            'fuerza': {'min': 0, 'max': 1000000, 'unit': 'N'},
            'porcentaje': {'min': 0, 'max': 100, 'unit': '%'}
        }
    
    def extract_numbers(self, text: str) -> Dict[str, List[Any]]:
        """
        Extraer TODOS los números con sus valores reales
        
        Returns:
            Dict con listas de valores extraídos
        """
        extracted = {}
        
        # Extraer por tipo
        for key, pattern in self.patterns.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            values = []
            
            for match in matches:
                if key == 'codigo_documento':
                    # Códigos como strings
                    values.append({
                        'value': match.group(1),
                        'position': match.start()
                    })
                    
                elif key in ['fecha_ddmmyyyy', 'fecha_yyyymmdd']:
                    # Fechas parseadas
                    groups = match.groups()
                    if key == 'fecha_ddmmyyyy':
                        day, month, year = groups
                    else:
                        year, month, day = groups
                    
                    values.append({
                        'value': f"{year}-{month}-{day}",
                        'day': int(day),
                        'month': int(month),
                        'year': int(year),
                        'position': match.start()
                    })
                    
                elif key == 'norma_iso':
                    # Normas con número
                    values.append({
                        'value': match.group(1),
                        'number': int(match.group(2)),
                        'position': match.start()
                    })
                    
                else:
                    # Valores numéricos
                    try:
                        numeric_value = float(match.group(1))
                        values.append({
                            'value': numeric_value,
                            'text': match.group(0),
                            'position': match.start()
                        })
                    except (ValueError, IndexError):
                        continue
            
            if values:
                extracted[key] = values
        
        return extracted
    
    def validate_numbers(self, extracted: Dict) -> Dict[str, List[Dict]]:
        """
        Validar que los números estén en rangos esperados
        
        Returns:
            Dict con información de validación
        """
        validation_results = {
            'valid': [],
            'warnings': [],
            'errors': []
        }
        
        for key, values in extracted.items():
            if key not in self.expected_ranges:
                continue
            
            range_info = self.expected_ranges[key]
            
            for item in values:
                value = item['value']
                
                if value < range_info['min']:
                    validation_results['errors'].append({
                        'type': key,
                        'value': value,
                        'reason': f"Valor menor al mínimo esperado ({range_info['min']} {range_info['unit']})"
                    })
                elif value > range_info['max']:
                    validation_results['errors'].append({
                        'type': key,
                        'value': value,
                        'reason': f"Valor mayor al máximo esperado ({range_info['max']} {range_info['unit']})"
                    })
                else:
                    validation_results['valid'].append({
                        'type': key,
                        'value': value,
                        'unit': range_info['unit']
                    })
        
        return validation_results
    
    def create_numerical_features(self, extracted: Dict) -> np.ndarray:
        """
        Crear vector de features numéricas para el modelo
        
        Returns:
            Array numpy con features normalizadas
        """
        features = []
        
        # 1. Contar ocurrencias de cada tipo
        for key in ['temperatura', 'presion', 'longitud', 'masa', 'fuerza', 'porcentaje']:
            count = len(extracted.get(key, []))
            features.append(count)
        
        # 2. Estadísticas de valores numéricos
        for key in ['temperatura', 'presion', 'longitud', 'masa', 'fuerza', 'porcentaje']:
            values_list = extracted.get(key, [])
            
            if values_list:
                values = [item['value'] for item in values_list]
                # Media, min, max, desviación estándar
                features.extend([
                    np.mean(values),
                    np.min(values),
                    np.max(values),
                    np.std(values) if len(values) > 1 else 0
                ])
            else:
                # Si no hay valores, llenar con ceros
                features.extend([0, 0, 0, 0])
        
        # 3. Indicadores booleanos (presencia)
        features.append(1 if 'codigo_documento' in extracted else 0)
        features.append(1 if 'fecha_ddmmyyyy' in extracted or 'fecha_yyyymmdd' in extracted else 0)
        features.append(1 if 'norma_iso' in extracted else 0)
        
        # 4. Normalización simple (evitar valores muy grandes)
        features_array = np.array(features, dtype=np.float32)
        
        # Normalización Min-Max para cada tipo
        # (En producción, usa scaler entrenado con datos de training)
        max_values = np.array([
            10,  # max count temperatura
            10,  # max count presion
            10,  # max count longitud
            10,  # max count masa
            10,  # max count fuerza
            10,  # max count porcentaje
            # Stats para cada tipo (media, min, max, std)
            100, 0, 100, 50,  # temperatura
            1000, 0, 1000, 500,  # presion
            1000, 0, 1000, 500,  # longitud
            1000, 0, 1000, 500,  # masa
            10000, 0, 10000, 5000,  # fuerza
            100, 0, 100, 50,  # porcentaje
            1, 1, 1  # booleanos
        ])
        
        # Evitar división por cero
        max_values = np.where(max_values == 0, 1, max_values)
        features_normalized = features_array / max_values
        
        return features_normalized
    
    def replace_with_tokens(self, text: str, extracted: Dict) -> str:
        """
        Reemplazar números con tokens, preservando orden
        """
        # Crear lista de todos los reemplazos con sus posiciones
        replacements = []
        
        for key, values in extracted.items():
            if key in self.replacement_tokens:
                token = self.replacement_tokens[key]
                for item in values:
                    replacements.append({
                        'start': item['position'],
                        'end': item['position'] + len(item.get('text', str(item['value']))),
                        'token': token
                    })
        
        # Ordenar por posición (de atrás hacia adelante para no afectar índices)
        replacements.sort(key=lambda x: x['start'], reverse=True)
        
        # Aplicar reemplazos
        processed = text
        for repl in replacements:
            processed = processed[:repl['start']] + repl['token'] + processed[repl['end']:]
        
        return processed
    
    def preprocess(
        self, 
        text: str, 
        create_features: bool = True,
        validate: bool = True
    ) -> Tuple[str, Dict, Optional[np.ndarray], Optional[Dict]]:
        """
        Preprocesamiento completo
        
        Args:
            text: Texto original
            create_features: Crear vector de features numéricas
            validate: Validar rangos de números
        
        Returns:
            (texto_procesado, numeros_extraidos, features_numericas, validacion)
        """
        # 1. Extraer números con sus valores reales
        extracted_numbers = self.extract_numbers(text)
        
        # 2. Validar números si se solicita
        validation = None
        if validate:
            validation = self.validate_numbers(extracted_numbers)
        
        # 3. Crear features numéricas si se solicita
        numerical_features = None
        if create_features:
            numerical_features = self.create_numerical_features(extracted_numbers)
        
        # 4. Reemplazar en texto con tokens
        processed_text = self.replace_with_tokens(text, extracted_numbers)
        
        # 5. Limpieza adicional
        processed_text = processed_text.lower()
        processed_text = re.sub(r'\s+', ' ', processed_text)
        processed_text = processed_text.strip()
        
        return processed_text, extracted_numbers, numerical_features, validation
    
    def analyze_document_type_by_numbers(self, extracted: Dict) -> Dict[str, float]:
        """
        Analizar qué tipo de documento podría ser basado en números
        Esto complementa la clasificación del modelo
        
        Returns:
            Dict con scores de probabilidad por tipo
        """
        scores = {
            'informe_ensayo': 0.0,
            'certificado_calibracion': 0.0,
            'procedimiento': 0.0,
            'registro': 0.0
        }
        
        # Reglas basadas en presencia de números
        
        # Informes de ensayo: muchas mediciones
        if extracted.get('presion') or extracted.get('fuerza'):
            scores['informe_ensayo'] += 0.3
        
        if extracted.get('temperatura') or extracted.get('masa'):
            scores['informe_ensayo'] += 0.2
        
        if len(extracted.get('porcentaje', [])) > 0:
            scores['informe_ensayo'] += 0.2
        
        # Certificados: código de documento + norma ISO + pocas mediciones
        if extracted.get('codigo_documento') and extracted.get('norma_iso'):
            scores['certificado_calibracion'] += 0.4
        
        if len(extracted.get('temperatura', [])) <= 2:
            scores['certificado_calibracion'] += 0.1
        
        # Procedimientos: normas ISO pero pocas mediciones
        if extracted.get('norma_iso') and not extracted.get('presion'):
            scores['procedimiento'] += 0.3
        
        # Registros: fechas + código
        if extracted.get('fecha_ddmmyyyy') or extracted.get('fecha_yyyymmdd'):
            scores['registro'] += 0.2
        
        if extracted.get('codigo_documento'):
            scores['registro'] += 0.1
        
        # Normalizar scores
        total = sum(scores.values())
        if total > 0:
            scores = {k: v/total for k, v in scores.items()}
        
        return scores
