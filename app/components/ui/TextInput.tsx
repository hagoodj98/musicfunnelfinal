import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import EmailIcon from "@mui/icons-material/Email";
import AccountCircle from "@mui/icons-material/AccountCircle";
import GroupIcon from "@mui/icons-material/Group";

type TextInputProps = {
  label: string;
  value: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  iconType: "email" | "account" | "group";
};

const TextInput = ({
  label,
  name,
  value,
  onChange,
  iconType,
}: TextInputProps) => {
  const getIcon = () => {
    switch (iconType) {
      case "email":
        return <EmailIcon className="text-yellow" fontSize="large" />;
      case "account":
        return <AccountCircle className="text-yellow" fontSize="large" />;
      case "group":
        return <GroupIcon className="text-yellow" fontSize="large" />;
      default:
        return null;
    }
  };

  return (
    <TextField
      variant="standard"
      className="text-white"
      fullWidth
      required
      id={`outlined-required-${label}`}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="start">{getIcon()}</InputAdornment>
          ),
        },
      }}
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      sx={{
        "& .MuiInputBase-input": {
          color: "#FDEAB6",
          fontSize: "1.02rem",
        },
        "& .MuiInputLabel-root": {
          color: "rgba(253, 234, 182, 0.82)",
          fontSize: "1rem",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#FDEAB6",
        },
        "& .MuiInput-underline:before": {
          borderBottomColor: "rgba(253, 234, 182, 0.42)",
        },
        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
          borderBottomColor: "rgba(253, 234, 182, 0.72)",
        },
        "& .MuiInput-underline:after": {
          borderBottomColor: "#EF4C12",
        },
      }}
    />
  );
};

export default TextInput;
