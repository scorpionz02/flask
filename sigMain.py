import numpy as np
from scipy.signal import resample, find_peaks
from SNR import SNR

def sigMain(sig, duration):
    # Sinyali yeniden örnekle
    sig = resample(sig, (len(sig) * 2) + int(0.1 * len(sig)))
    n = len(sig)

    print("Duration:", duration)
    print("N:", n)

    dt = duration / n
    t = np.linspace(0, duration, n)

    # Frekans vektörünü al
    fcomp = np.fft.fft(sig, n)
    PSD = fcomp * np.conj(fcomp) / n
    freq = (1/(dt*n)) * np.arange(n)
    L = np.arange(1, np.floor(n/2), dtype="int")

    # Belirtilen frekansları filtrele
    ffilt = fcomp
    freqMin = 0.38  # Hz
    freqMax = 2     # Hz
    for f in range(1, int(np.floor(len(freq)/2))):
        tempFreq = freq[f]
        if tempFreq <= freqMin or tempFreq >= freqMax:
            ffilt[f] = 0
            ffilt[-f] = 0

    # IFFT ile filtrelenmiş sinyali elde et
    sigfilt = np.real(np.fft.ifft(ffilt))

    # Düzgün sinyali elde et
    sigfilt = np.real(sigfilt)

    # HRV Hesapla
    horzdist = 12
    peaks = find_peaks(sigfilt, height=1, distance=horzdist)
    timePeaksms = t[peaks[0]] * 1000  # milisaniye cinsine çevir
    rrIntervals = [0 for i in range(len(timePeaksms) - 1)]
    
    for b in range(len(timePeaksms) - 1):
        rrIntervals[b] = timePeaksms[b + 1] - timePeaksms[b]

    variabilities = [0 for i in range(len(rrIntervals) - 1)]
    for v in range(len(rrIntervals) - 1):
        variabilities[v] = rrIntervals[v + 1] - rrIntervals[v]

    soma = sum(v ** 2 for v in variabilities)
    rMSSD = np.sqrt(soma / len(variabilities))  # ms
    HRV = rMSSD

    # BPM Hesapla
    nbp = (len(peaks[0])) / 2
    nbpm = int(np.around(60 * nbp / duration))

    # SNR Hesapla
    SignalToNoiseRatio = abs((SNR(sig, sigfilt)).real)  # dB

    # Sonuçları döndür
    return HRV, nbpm, SignalToNoiseRatio
