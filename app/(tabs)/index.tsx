import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import  AsyncStorage  from "@react-native-async-storage/async-storage";

// Interface para definir a estrutura de uma tarefa
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

// Definição do esquema de validação usando Zod
const taskSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
});

// Tipo inferido com base no schema do Zod
type TaskFormData = z.infer<typeof taskSchema>;

export default function TaskManager() {
  // Estados para gerenciar a lista de tarefas, tarefa em edição, filtro e tarefa selecionada
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Hook para manipular o formulário, com validação integrada via Zod
  const { control, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "" },
  });

  // Função para obter todas as tarefas do armazenamento local
  const getAllTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem("tasks");
      return storedTasks ? JSON.parse(storedTasks) : [];
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      return [];
    }
  };

  // Função para salvar todas as tarefas no armazenamento local
  const saveAllTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error);
    }
  };

  // Função para adicionar uma nova tarefa
  const addTask = async (task: TaskFormData) => {
    const newTask: Task = {
      id: Date.now().toString(), // Usando timestamp como id
      title: task.title,
      description: task.description || "",
      completed: false,
    };

    const updatedTasks = [...tasks, newTask];
    await saveAllTasks(updatedTasks);
    reset({ title: "", description: "" });
  };

  // Função para editar uma tarefa existente
  const editExistingTask = async (taskData: TaskFormData) => {
    if (editTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === editTask.id
          ? { ...task, title: taskData.title, description: taskData.description || "" }
          : task
      );

      await saveAllTasks(updatedTasks);
      setEditTask(null);
      reset({ title: "", description: "" });
    }
  };

  // Função para deletar uma tarefa
  const deleteTask = async (task: Task) => {
    const updatedTasks = tasks.filter((t) => t.id !== task.id);
    await saveAllTasks(updatedTasks);
  };

  // Função para alternar o estado de conclusão de uma tarefa
  const toggleCompleteTask = async (task: Task) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );

    await saveAllTasks(updatedTasks);
  };

  // Função para abrir o menu de opções de uma tarefa
  const openOptions = (task: Task) => {
    setSelectedTask(task);
    setEditTask(null);
    reset();
  };

  // Função que executa ações (completar, editar, deletar) em uma tarefa selecionada
  const handleOptionsAction = (action: string) => {
    if (selectedTask) {
      if (action === "complete" || action === "incomplete") {
        toggleCompleteTask(selectedTask);
      } else if (action === "edit") {
        setEditTask(selectedTask);
        reset({ title: selectedTask.title, description: selectedTask.description || "" });
      } else if (action === "delete") {
        deleteTask(selectedTask);
      }
    }
    setSelectedTask(null);
    reset();
  };

  // Carregar tarefas do AsyncStorage quando o componente for montado
  useEffect(() => {
    getAllTasks().then((storedTasks) => setTasks(storedTasks));
  }, []);

  // Filtra as tarefas de acordo com o estado selecionado no filtro (todas, completas ou incompletas)
  const filteredTasks = tasks.filter((task) => {
    if (filter === "complete") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lista de Tarefas</Text>

      {/* Formulário para adicionar ou editar uma tarefa */}
      <View style={styles.inputContainer}>
        <Controller
          name="title"
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

        <Controller
          name="description"
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Descrição (Opcional)"
              value={value || ""}
              onChangeText={onChange}
            />
          )}
        />

        {/* Botão para adicionar ou salvar a edição da tarefa */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleSubmit(editTask ? editExistingTask : addTask)}
          >
            <Text style={styles.addButtonText}>
              {editTask ? "Salvar Edição" : "Adicionar Tarefa"}
            </Text>
          </TouchableOpacity>
          {editTask && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditTask(null)}>
              <Text style={styles.cancelButtonText}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtro para alternar entre todas, completas ou incompletas */}
      <View style={styles.filterContainer}>
        {["all", "complete", "incomplete"].map((type) => (
          <TouchableOpacity
            key={type}
            style={filter === type ? styles.filterButtonActive : styles.filterButton}
            onPress={() => setFilter(type as "all" | "complete" | "incomplete")}
          >
            <Text style={styles.filterButtonText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de tarefas filtradas */}
      <FlatList
        data={tasks && filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.taskCard, item.completed ? styles.taskCardComplete : styles.taskCardIncomplete]}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            {item.description ? <Text>{item.description}</Text> : null}
            <Text style={styles.taskStatus}>
              {item.completed ? "Status: Completa" : "Status: Incompleta"}
            </Text>
            <View style={styles.taskActions}>
              <TouchableOpacity style={styles.taskButton} onPress={() => openOptions(item)}>
                <Text style={styles.taskButtonText}>Opções</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Menu de opções para a tarefa selecionada */}
      {selectedTask && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleOptionsAction(selectedTask.completed ? "incomplete" : "complete")}
          >
            <Text style={styles.optionButtonText}>
              {selectedTask.completed ? "Marcar como Incompleta" : "Marcar como Completa"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleOptionsAction("edit")}>
            <Text style={styles.optionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => handleOptionsAction("delete")}>
            <Text style={styles.optionButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Estilos usados na interface do app
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  inputContainer: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  addButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5 },
  addButtonText: { color: "#fff", textAlign: "center" },
  cancelButton: { backgroundColor: "#dc3545", padding: 10, borderRadius: 5 },
  cancelButtonText: { color: "#fff", textAlign: "center" },
  errorText: { color: "#dc3545", marginBottom: 10 },
  filterContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  filterButton: { padding: 10, borderWidth: 1, borderRadius: 5, borderColor: "#ccc" },
  filterButtonActive: { padding: 10, borderWidth: 1, borderRadius: 5, borderColor: "#28a745", backgroundColor: "#dff0d8" },
  filterButtonText: { textAlign: "center" },
  taskCard: { padding: 20, borderRadius: 5, marginBottom: 10, borderWidth: 1, borderColor: "#ccc" },
  taskCardComplete: { backgroundColor: "#dff0d8" },
  taskCardIncomplete: { backgroundColor: "#f8d7da" },
  taskTitle: { fontSize: 18, fontWeight: "bold" },
  taskStatus: { fontSize: 14, marginTop: 5 },
  taskActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  taskButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 5 },
  taskButtonText: { color: "#fff" },
  optionsContainer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 10, borderTopRightRadius: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: -2 }, shadowRadius: 10 },
  optionButton: { padding: 15, backgroundColor: "#007bff", borderRadius: 5, marginBottom: 10 },
  optionButtonText: { color: "#fff", textAlign: "center" },
});