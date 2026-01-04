"""
Procesador de documentos para extracción de texto y metadatos
Soporta PDF, DOCX, imágenes con OCR
"""

import os
from typing import Dict, Optional
from fastapi import UploadFile
import PyPDF2
import pdfplumber
from docx import Document
from PIL import Image
import pytesseract
from app.config import settings


class DocumentProcessor:
    """Procesa diferentes tipos de documentos"""
    
    def __init__(self):
        # Configurar pytesseract si está disponible
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass
    
    async def extract_text(self, file: UploadFile) -> str:
        """
        Extraer texto del documento según su tipo
        
        Args:
            file: Archivo subido
            
        Returns:
            Texto extraído del documento
        """
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Guardar temporalmente
        temp_path = os.path.join(settings.TEMP_DIR, file.filename)
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        try:
            if file_ext == '.pdf':
                text = self._extract_from_pdf(temp_path)
            elif file_ext == '.docx':
                text = self._extract_from_docx(temp_path)
            elif file_ext == '.txt':
                with open(temp_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            elif file_ext in ['.png', '.jpg', '.jpeg']:
                text = self._extract_from_image(temp_path)
            else:
                raise ValueError(f"Tipo de archivo no soportado: {file_ext}")
            
            return text
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    def _extract_from_pdf(self, path: str) -> str:
        """Extraer texto de PDF usando pdfplumber (mejor que PyPDF2)"""
        text = ""
        
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            # Fallback a PyPDF2
            print(f"pdfplumber falló, usando PyPDF2: {e}")
            with open(path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        
        return text.strip()
    
    def _extract_from_docx(self, path: str) -> str:
        """Extraer texto de documento Word"""
        doc = Document(path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    
    def _extract_from_image(self, path: str) -> str:
        """Extraer texto de imagen usando OCR"""
        try:
            image = Image.open(path)
            text = pytesseract.image_to_string(image, lang='spa')  # Español
            return text.strip()
        except Exception as e:
            raise ValueError(f"Error en OCR: {e}. Asegúrate de tener Tesseract instalado.")
    
    async def extract_metadata(self, file: UploadFile, text_content: str) -> Dict:
        """
        Extraer metadatos adicionales del documento
        
        Args:
            file: Archivo subido
            text_content: Texto ya extraído
            
        Returns:
            Diccionario con metadatos
        """
        metadata = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": file.size if hasattr(file, 'size') else 0,
            "text_length": len(text_content),
            "word_count": len(text_content.split()),
        }
        
        # Buscar patrones específicos ISO 17025
        patterns = self._extract_iso17025_patterns(text_content)
        metadata.update(patterns)
        
        return metadata
    
    def _extract_iso17025_patterns(self, text: str) -> Dict:
        """Extraer patrones específicos de documentos ISO 17025"""
        import re
        
        patterns = {}
        
        # Buscar código de informe/certificado (ej: LAB-2025-001)
        codigo_match = re.search(r'\b[A-Z]{2,4}-\d{4}-\d{3,4}\b', text)
        if codigo_match:
            patterns["codigo_documento"] = codigo_match.group()
        
        # Buscar fechas (DD/MM/YYYY o YYYY-MM-DD)
        fechas = re.findall(r'\b\d{2}/\d{2}/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b', text)
        if fechas:
            patterns["fechas_encontradas"] = fechas[:3]  # Primeras 3
        
        # Palabras clave que indican tipo de documento
        keywords = {
            "informe_ensayo": ["informe de ensayo", "resultado del ensayo", "método de ensayo"],
            "certificado_calibracion": ["certificado de calibración", "calibración", "patrón de referencia"],
            "procedimiento": ["procedimiento", "método", "instructivo"],
            "registro": ["registro", "formulario", "formato"],
        }
        
        detected_keywords = []
        for doc_type, words in keywords.items():
            for word in words:
                if word.lower() in text.lower():
                    detected_keywords.append(doc_type)
                    break
        
        if detected_keywords:
            patterns["keywords_detected"] = list(set(detected_keywords))
        
        return patterns
