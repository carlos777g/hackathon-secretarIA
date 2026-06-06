import streamlit as st
import pandas as pd

st.title("DerramaAI CDMX")

eventos = {
    "Evento": ["Vive Latino", "Formula 1", "Dia de Muertos", "Corona Capital"],
    "Visitantes": [80000, 40000, 700000, 85000],
    "GastoPromedio": [4500, 12000, 2800, 5000]
}

df = pd.DataFrame(eventos)

evento = st.selectbox("Selecciona un evento", df["Evento"])

if st.button("Analizar"):
    fila = df[df["Evento"] == evento].iloc[0]

    derrama = fila["Visitantes"] * fila["GastoPromedio"]
    empleos = int(derrama / 200000)
    negocios = int(fila["Visitantes"] / 100)

    st.metric("Derrama Económica", f"${derrama:,.0f}")
    st.metric("Empleos Generados", empleos)
    st.metric("Negocios Beneficiados", negocios)
