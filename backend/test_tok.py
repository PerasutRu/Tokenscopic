import sys
try:
    from transformers import AutoTokenizer
    AutoTokenizer.from_pretrained('nectec/Pata-Thai-Dataset')
except Exception as e:
    print("EXCEPTION:", repr(e))
    print("STRING:", str(e).lower())
